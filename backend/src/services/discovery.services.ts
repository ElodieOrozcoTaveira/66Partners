import "dotenv/config";
import { createHash } from "node:crypto";
import { and, asc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { sports, userMapProfiles, users, userSports } from "../db/schema.js";
import { ActivityService } from "./activity.services.js";
import { notBlockedWith } from "./block.services.js";
import { NEARBY_RADIUS_KM } from "./nearby.services.js";

const db = drizzle(process.env.DATABASE_URL!);

const GEO_COMMUNE_URL = "https://geo.api.gouv.fr/communes";
const GEO_TIMEOUT_MS = 5000;
const KM_PER_LATITUDE_DEGREE = 111.32;
/** Décalage d'affichage maximal (~2 km) autour du centre de la commune. */
const PIN_SPREAD_DEGREES = 0.02;
const MAX_MEMBERS = 200;
const MAX_UPCOMING_ACTIVITIES = 6;

/**
 * SERVICE « SPORTIFS AUTOUR DE TOI »
 *
 * Carte des membres, sur consentement explicite (une ligne dans
 * user_map_profiles = visible ; aucune ligne = invisible).
 * - jamais de GPS : le membre choisit une commune, dont on ne conserve que le
 *   centre officiel, donnée publique (user_locations, qui sert au compteur,
 *   n'est jamais lu ici) ;
 * - le centre de recherche est toujours la commune du membre, jamais un point
 *   choisi par l'appelant, pour empêcher de balayer la carte ;
 * - voir la carte suppose d'y être visible soi-même ;
 * - email, date de naissance et genre ne sortent jamais de ce service.
 */

export class DiscoveryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "DiscoveryError";
  }
}

export interface MapVisibility {
  inseeCode: string;
  sectorName: string;
  showAge: boolean;
  consentedAt: Date;
}

export interface MapMember {
  id: string;
  pseudo: string;
  avatar: string | null;
  age: number | null;
  sectorName: string;
  lookingFor: string | null;
  latitude: number;
  longitude: number;
  sports: { id: string; name: string; level: string }[];
}

/**
 * Décalage stable, tiré de l'identifiant du membre : il sépare les pins d'une
 * même commune sans rien révéler de l'endroit où le membre habite.
 */
function pinOffset(userId: string, axis: "lat" | "lng"): number {
  const hash = createHash("sha256").update(`${axis}:${userId}`).digest();
  return (hash.readUInt16BE(0) / 0xffff - 0.5) * 2 * PIN_SPREAD_DEGREES;
}

export function ageFromBirthDate(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const birthdayPassed =
    now.getUTCMonth() + 1 > month || (now.getUTCMonth() + 1 === month && now.getUTCDate() >= day);
  return now.getUTCFullYear() - year - (birthdayPassed ? 0 : 1);
}

async function fetchCommune(inseeCode: string) {
  let response: Response;
  try {
    response = await fetch(`${GEO_COMMUNE_URL}/${inseeCode}?fields=nom,centre`, {
      signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
    });
  } catch {
    throw new DiscoveryError(
      "Impossible de vérifier cette commune pour le moment. Réessaie plus tard.",
      "COMMUNE_LOOKUP_FAILED",
      503
    );
  }
  if (response.status === 404) {
    throw new DiscoveryError("Commune introuvable.", "COMMUNE_NOT_FOUND", 400);
  }
  if (!response.ok) {
    throw new DiscoveryError(
      "Impossible de vérifier cette commune pour le moment. Réessaie plus tard.",
      "COMMUNE_LOOKUP_FAILED",
      503
    );
  }
  const commune = (await response.json()) as {
    nom?: string;
    centre?: { coordinates?: [number, number] };
  };
  const [longitude, latitude] = commune.centre?.coordinates ?? [];
  if (!commune.nom || typeof latitude !== "number" || typeof longitude !== "number") {
    throw new DiscoveryError("Commune introuvable.", "COMMUNE_NOT_FOUND", 400);
  }
  return { name: commune.nom, latitude, longitude };
}

async function requireVisibleViewer(viewerId: string) {
  const [viewer] = await db
    .select({
      latitude: userMapProfiles.latitude,
      longitude: userMapProfiles.longitude,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(userMapProfiles)
    .innerJoin(users, eq(users.id, userMapProfiles.userId))
    .where(eq(userMapProfiles.userId, viewerId))
    .limit(1);

  if (!viewer || !viewer.emailVerifiedAt) {
    throw new DiscoveryError(
      "Active ta visibilité pour découvrir les sportifs autour de toi.",
      "MAP_VISIBILITY_REQUIRED",
      403
    );
  }
  return { latitude: viewer.latitude, longitude: viewer.longitude };
}

async function selectMembers(
  viewerId: string,
  { latitude: lat, longitude: lon }: { latitude: number; longitude: number },
  onlyMemberId?: string
): Promise<MapMember[]> {
  const latDelta = NEARBY_RADIUS_KM / KM_PER_LATITUDE_DEGREE;
  const distanceKm = sql<number>`2 * 6371 * asin(sqrt(
    power(sin(radians(${userMapProfiles.latitude} - ${lat}) / 2), 2)
    + cos(radians(${lat})) * cos(radians(${userMapProfiles.latitude}))
    * power(sin(radians(${userMapProfiles.longitude} - ${lon}) / 2), 2)
  ))`;

  const rows = await db
    .select({
      id: users.id,
      pseudo: users.pseudo,
      avatar: users.avatar,
      birthDate: users.birthDate,
      lookingFor: users.lookingFor,
      showAge: userMapProfiles.showAge,
      sectorName: userMapProfiles.sectorName,
      latitude: userMapProfiles.latitude,
      longitude: userMapProfiles.longitude,
    })
    .from(userMapProfiles)
    .innerJoin(users, eq(users.id, userMapProfiles.userId))
    .where(
      and(
        ne(userMapProfiles.userId, viewerId),
        onlyMemberId ? eq(userMapProfiles.userId, onlyMemberId) : undefined,
        isNotNull(users.emailVerifiedAt),
        notBlockedWith(viewerId, userMapProfiles.userId),
        sql`${userMapProfiles.latitude} between ${lat - latDelta} and ${lat + latDelta}`,
        sql`${distanceKm} <= ${NEARBY_RADIUS_KM}`
      )
    )
    .orderBy(asc(distanceKm), asc(users.id))
    .limit(MAX_MEMBERS);

  const sportsByUser = new Map<string, MapMember["sports"]>();
  if (rows.length > 0) {
    const sportRows = await db
      .select({
        userId: userSports.userId,
        id: sports.id,
        name: sports.name,
        level: userSports.level,
      })
      .from(userSports)
      .innerJoin(sports, eq(sports.id, userSports.sportId))
      .where(inArray(userSports.userId, rows.map((row) => row.id)))
      .orderBy(asc(sports.name));
    for (const { userId, ...sport } of sportRows) {
      sportsByUser.set(userId, [...(sportsByUser.get(userId) ?? []), sport]);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    pseudo: row.pseudo,
    avatar: row.avatar,
    age: row.showAge ? ageFromBirthDate(row.birthDate) : null,
    sectorName: row.sectorName,
    lookingFor: row.lookingFor,
    latitude: Number((row.latitude + pinOffset(row.id, "lat")).toFixed(3)),
    longitude: Number((row.longitude + pinOffset(row.id, "lng")).toFixed(3)),
    sports: sportsByUser.get(row.id) ?? [],
  }));
}

export const DiscoveryService = {
  async getVisibility(userId: string): Promise<MapVisibility | null> {
    const [row] = await db
      .select({
        inseeCode: userMapProfiles.inseeCode,
        sectorName: userMapProfiles.sectorName,
        showAge: userMapProfiles.showAge,
        consentedAt: userMapProfiles.consentedAt,
      })
      .from(userMapProfiles)
      .where(eq(userMapProfiles.userId, userId))
      .limit(1);
    return row ?? null;
  },

  /** Active (ou met à jour) la visibilité du membre sur la carte. */
  async enable(userId: string, input: { inseeCode: string; showAge: boolean }): Promise<MapVisibility> {
    const [user] = await db
      .select({ emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user?.emailVerifiedAt) {
      throw new DiscoveryError(
        "Confirme ton adresse email pour apparaître sur la carte : clique sur le lien reçu à l'inscription.",
        "EMAIL_NOT_VERIFIED",
        403
      );
    }

    const commune = await fetchCommune(input.inseeCode);
    const sector = {
      inseeCode: input.inseeCode,
      sectorName: commune.name,
      latitude: commune.latitude,
      longitude: commune.longitude,
      showAge: input.showAge,
      updatedAt: new Date(),
    };

    const [row] = await db
      .insert(userMapProfiles)
      .values({ userId, ...sector })
      .onConflictDoUpdate({ target: userMapProfiles.userId, set: sector })
      .returning({
        inseeCode: userMapProfiles.inseeCode,
        sectorName: userMapProfiles.sectorName,
        showAge: userMapProfiles.showAge,
        consentedAt: userMapProfiles.consentedAt,
      });
    return row!;
  },

  /** Retire le membre de la carte et efface son secteur. */
  async disable(userId: string): Promise<void> {
    await db.delete(userMapProfiles).where(eq(userMapProfiles.userId, userId));
  },

  /** Membres visibles dans le rayon fixe autour de la commune du membre connecté. */
  async listAround(viewerId: string): Promise<{ members: MapMember[]; radiusKm: number }> {
    const viewer = await requireVisibleViewer(viewerId);
    return { radiusKm: NEARBY_RADIUS_KM, members: await selectMembers(viewerId, viewer) };
  },

  /**
   * Détail d'un membre pour son profil, soumis aux mêmes règles que la carte.
   * Seules les activités qu'il organise sont listées, jamais celles qu'il a
   * rejointes, pour ne pas permettre de suivre ses déplacements.
   */
  async getMember(viewerId: string, memberId: string) {
    const viewer = await requireVisibleViewer(viewerId);
    const [member] = await selectMembers(viewerId, viewer, memberId);
    if (!member) {
      throw new DiscoveryError("Membre introuvable.", "MEMBER_NOT_FOUND", 404);
    }
    const activities = await ActivityService.listActivities({
      creatorId: memberId,
      from: new Date(),
      viewerId,
    });
    return {
      member,
      upcomingActivities: activities
        .filter((activity) => activity.status !== "CANCELLED")
        .slice(0, MAX_UPCOMING_ACTIVITIES)
        .map((activity) => ({
          id: activity.id,
          title: activity.title,
          city: activity.city,
          startDate: activity.startDate,
          maxParticipants: activity.maxParticipants,
          participantsCount: activity.participantsCount,
          status: activity.status,
          sportName: activity.sportName,
          creatorPseudo: activity.creatorPseudo,
          creatorAvatar: activity.creatorAvatar,
          levelRequired: activity.levelRequired,
          audience: activity.audience,
        })),
    };
  },
};
