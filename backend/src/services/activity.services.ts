import "dotenv/config";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  activitiesStatusEnum,
  activityPhotos,
  participations,
  sportLevelEnum,
  sports,
  territories,
  users,
} from "../db/schema.js";
import { notBlockedWith } from "./block.services.js";
import { TerritoryService } from "./territory.services.js";
import { checkAudience, type ActivityAudience } from "../utils/audience.js";
import { deleteUploadedFileIfUnreferenced } from "../utils/uploadedFiles.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE ACTIVITÉ
 *
 * Contient la logique métier liée à la création, la consultation et
 * la gestion des activités sportives.
 */

export type ActivityLevel = (typeof sportLevelEnum.enumValues)[number];
export type ActivityStatus = (typeof activitiesStatusEnum.enumValues)[number];
export type Activity = typeof activities.$inferSelect;

export type ActivityWithDetails = Activity & {
  sportName: string;
  participantsCount: number;
  // Nullable : le créateur peut avoir supprimé son compte (creatorId passe
  // alors à null, cf. schema.ts) — l'activité reste visible et fonctionnelle
  // pour les autres participants, seule l'identité du créateur disparaît.
  creatorPseudo: string | null;
  creatorAvatar: string | null;
};

export interface ActivityCreateInput {
  title: string;
  description?: string | null;
  city: string;
  startDate: Date;
  latitude?: number | null;
  longitude?: number | null;
  levelRequired: ActivityLevel;
  maxParticipants: number;
  sportId: string;
  /** Territoire où se déroule l'activité. Si absent, résolu depuis le territoire
   *  par défaut du créateur — jamais fait confiance tel quel : l'appartenance
   *  du créateur au territoire est toujours vérifiée côté serveur. */
  territoryId?: string;
  carpoolEnabled?: boolean;
  /** Ouverte à tous (défaut) ou réservée — l'organisateur doit en faire partie. */
  audience?: ActivityAudience;
}

export interface ActivityUpdateInput {
  title?: string;
  description?: string | null;
  city?: string;
  startDate?: Date;
  latitude?: number | null;
  longitude?: number | null;
  levelRequired?: ActivityLevel;
  maxParticipants?: number;
  status?: ActivityStatus;
  sportId?: string;
  carpoolEnabled?: boolean;
  audience?: ActivityAudience;
}

export interface ActivityFilters {
  city?: string;
  sportId?: string;
  status?: ActivityStatus;
  /** Ne retourne que les activités où cet utilisateur a une participation acceptée */
  participantId?: string;
  /** Code du territoire (ex: "66") */
  territory?: string;
  /** Borne basse (incluse) sur activities.startDate — ex. "maintenant" pour
   *  n'exposer que les activités à venir dans les listes publiques. */
  from?: Date;
  /** Borne haute (incluse) sur activities.startDate. */
  to?: Date;
  /** Public de l'activité (ex. "WOMEN" pour les sorties entre femmes). */
  audience?: ActivityAudience;
  /** Membre connecté : les activités des membres bloqués (dans les deux sens) sont exclues. */
  viewerId?: string;
}

// Erreurs métier personnalisées
export class ActivityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ActivityError";
  }
}

async function assertSportExists(sportId: string): Promise<void> {
  const result = await db.execute(
    sql`SELECT 1 FROM sports WHERE id = ${sportId}::uuid LIMIT 1`
  );
  if (result.rows.length === 0) {
    throw new ActivityError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
  }
}

export class ActivityService {
  /**
   * Création d'une nouvelle activité
   */
  static async createActivity(
    creatorId: string,
    data: ActivityCreateInput
  ): Promise<Activity> {
    await assertSportExists(data.sportId);

    // Organiser une sortie demande une adresse email confirmée (limite les
    // faux comptes) ; rejoindre une sortie reste possible sans.
    const [creator] = await db
      .select({ emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.id, creatorId))
      .limit(1);
    if (creator && !creator.emailVerifiedAt) {
      throw new ActivityError(
        "Confirme ton adresse email pour organiser une sortie : clique sur le lien reçu à l'inscription.",
        "EMAIL_NOT_VERIFIED",
        403
      );
    }

    // Activité réservée : l'organisateur doit lui-même en faire partie
    // (une sortie "entre femmes" est organisée par une femme).
    if (data.audience && data.audience !== "ALL") {
      const check = await checkAudience(creatorId, data.audience);
      if (!check.ok) throw new ActivityError(check.message, check.code, 403);
    }

    // Un utilisateur a un territoire principal (isDefault), mais n'est
    // jamais restreint à y créer ses activités : il peut créer une activité
    // sur n'importe quel territoire réel (ex. de passage à Montpellier tout
    // en ayant 66Partners comme territoire principal) — l'appartenance
    // (user_territories) ne conditionne plus rien ici, seule l'existence du
    // territoire est vérifiée. Sans territoryId fourni par le client, on
    // retombe sur le territoire par défaut du créateur.
    let territoryId = data.territoryId;

    if (territoryId) {
      await TerritoryService.getById(territoryId);
    } else {
      const defaultTerritory = await TerritoryService.getDefaultTerritoryForUser(creatorId);
      if (!defaultTerritory) {
        throw new ActivityError(
          "Aucun territoire par défaut pour cet utilisateur",
          "NOT_TERRITORY_MEMBER",
          403
        );
      }
      territoryId = defaultTerritory.id;
    }

    const [newActivity] = await db
      .insert(activities)
      .values({
        ...data,
        creatorId,
        territoryId,
      })
      .returning();

    if (!newActivity) {
      throw new ActivityError(
        "Erreur lors de la création de l'activité",
        "ACTIVITY_CREATION_FAILED",
        500
      );
    }

    return newActivity;
  }

  /**
   * Récupération d'une activité par son ID
   */
  static async getActivityById(activityId: string): Promise<ActivityWithDetails | null> {
    const [activity] = await db
      .select({
        id: activities.id,
        title: activities.title,
        description: activities.description,
        city: activities.city,
        startDate: activities.startDate,
        latitude: activities.latitude,
        longitude: activities.longitude,
        levelRequired: activities.levelRequired,
        maxParticipants: activities.maxParticipants,
        status: activities.status,
        sportId: activities.sportId,
        creatorId: activities.creatorId,
        territoryId: activities.territoryId,
        carpoolEnabled: activities.carpoolEnabled,
        audience: activities.audience,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        sportName: sports.name,
        participantsCount: sql<number>`count(distinct case when ${participations.status} = 'ACCEPTED' then ${participations.id} end)`,
        creatorPseudo: users.pseudo,
        creatorAvatar: users.avatar,
      })
      .from(activities)
      .innerJoin(sports, eq(sports.id, activities.sportId))
      .leftJoin(users, eq(users.id, activities.creatorId))
      .leftJoin(participations, eq(participations.activityId, activities.id))
      .where(eq(activities.id, activityId))
      .groupBy(activities.id, sports.name, users.pseudo, users.avatar)
      .limit(1);

    if (!activity) return null;

    return { ...activity, participantsCount: Number(activity.participantsCount) };
  }

  /**
   * Récupération du détail d'une activité pour un utilisateur authentifié.
   * Aucune vérification d'appartenance au territoire : n'importe quel
   * utilisateur connecté peut consulter (et, via ParticipationService,
   * rejoindre) une activité sur n'importe quel territoire, pas seulement le
   * sien — cf. créer/rejoindre une activité de passage sur un autre
   * territoire que son territoire principal.
   */
  static async getActivityDetailForUser(activityId: string): Promise<ActivityWithDetails | null> {
    return ActivityService.getActivityById(activityId);
  }

  /**
   * Liste des activités, avec filtres optionnels. Inclut le nom du sport et
   * le nombre réel de participants acceptés (calculé à la volée).
   */
  static async listActivities(filters: ActivityFilters = {}): Promise<ActivityWithDetails[]> {
    const { city, sportId, status, participantId, territory, from, to, audience, viewerId } = filters;

    const conditions = [
      city ? eq(activities.city, city) : undefined,
      sportId ? eq(activities.sportId, sportId) : undefined,
      status ? eq(activities.status, status) : undefined,
      territory ? eq(territories.code, territory) : undefined,
      from ? gte(activities.startDate, from) : undefined,
      to ? lte(activities.startDate, to) : undefined,
      audience ? eq(activities.audience, audience) : undefined,
      viewerId ? notBlockedWith(viewerId, activities.creatorId) : undefined,
      participantId
        ? sql`exists (
            select 1 from ${participations} as participant_filter
            where participant_filter.activity_id = ${activities.id}
              and participant_filter.user_id = ${participantId}::uuid
              and participant_filter.status = 'ACCEPTED'
          )`
        : undefined,
    ].filter((condition) => condition !== undefined);

    const rows = await db
      .select({
        id: activities.id,
        title: activities.title,
        description: activities.description,
        city: activities.city,
        startDate: activities.startDate,
        latitude: activities.latitude,
        longitude: activities.longitude,
        levelRequired: activities.levelRequired,
        maxParticipants: activities.maxParticipants,
        status: activities.status,
        sportId: activities.sportId,
        creatorId: activities.creatorId,
        territoryId: activities.territoryId,
        carpoolEnabled: activities.carpoolEnabled,
        audience: activities.audience,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        sportName: sports.name,
        participantsCount: sql<number>`count(distinct case when ${participations.status} = 'ACCEPTED' then ${participations.id} end)`,
        creatorPseudo: users.pseudo,
        creatorAvatar: users.avatar,
      })
      .from(activities)
      .innerJoin(sports, eq(sports.id, activities.sportId))
      .innerJoin(territories, eq(territories.id, activities.territoryId))
      .leftJoin(users, eq(users.id, activities.creatorId))
      .leftJoin(participations, eq(participations.activityId, activities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(activities.id, sports.name, users.pseudo, users.avatar)
      .orderBy(activities.startDate);

    return rows.map((row) => ({
      ...row,
      participantsCount: Number(row.participantsCount),
    }));
  }

  /**
   * Mise à jour d'une activité (réservé à son créateur)
   */
  static async updateActivity(
    activityId: string,
    requesterId: string,
    data: ActivityUpdateInput
  ): Promise<Activity> {
    const activity = await ActivityService.getActivityById(activityId);

    if (!activity) {
      throw new ActivityError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
    }

    if (activity.creatorId !== requesterId) {
      throw new ActivityError(
        "Seul le créateur peut modifier cette activité",
        "FORBIDDEN",
        403
      );
    }

    if (data.sportId) {
      await assertSportExists(data.sportId);
    }

    if (data.audience && data.audience !== activity.audience) {
      // Revenir à "ouverte à tous" est toujours possible. Restreindre (ou
      // changer de public) exclurait des participants déjà acceptés : refusé
      // dès qu'il y en a un.
      if (data.audience !== "ALL") {
        if (activity.participantsCount > 0) {
          throw new ActivityError(
            "Le public ne peut plus être restreint : des participants ont déjà été acceptés.",
            "AUDIENCE_LOCKED",
            409
          );
        }
        const check = await checkAudience(requesterId, data.audience);
        if (!check.ok) throw new ActivityError(check.message, check.code, 403);
      }
    }

    const [updatedActivity] = await db
      .update(activities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(activities.id, activityId))
      .returning();

    if (!updatedActivity) {
      throw new ActivityError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
    }

    return updatedActivity;
  }

  /**
   * Suppression d'une activité (réservé à son créateur)
   */
  static async deleteActivity(
    activityId: string,
    requesterId: string
  ): Promise<void> {
    const activity = await ActivityService.getActivityById(activityId);

    if (!activity) {
      throw new ActivityError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
    }

    if (activity.creatorId !== requesterId) {
      throw new ActivityError(
        "Seul le créateur peut supprimer cette activité",
        "FORBIDDEN",
        403
      );
    }

    // Photos qui vont disparaître en cascade avec l'activité : à capturer
    // AVANT la suppression, sans quoi les lignes ne seront plus
    // interrogeables — cf. chantier RGPD F-04.
    const photos = await db
      .select({ url: activityPhotos.url })
      .from(activityPhotos)
      .where(eq(activityPhotos.activityId, activityId));

    await db.delete(activities).where(eq(activities.id, activityId));

    await Promise.all(photos.map((photo) => deleteUploadedFileIfUnreferenced(photo.url)));
  }
}
