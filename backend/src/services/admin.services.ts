import "dotenv/config";
import crypto from "crypto";
import argon2 from "argon2";
import { and, desc, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  adminCredentials,
  messages,
  notifications,
  participations,
  sports,
  territories,
  userTerritories,
  users,
} from "../db/schema.js";
import { signAdminToken } from "../utils/adminJwt.js";
import { sendAdminResetPasswordEmail } from "./mail.services.js";
import { AccountDeletionService } from "./accountDeletion.services.js";
import { TerritoryService } from "./territory.services.js";

const db = drizzle(process.env.DATABASE_URL!);

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

// Le token brut part par email ; seul son hash est conservé en base (comme
// pour un mot de passe : une fuite de la base ne permet pas de le rejouer).
// Même principe que hashResetToken dans auth.services.ts, dupliqué ici car
// trop petit pour justifier un partage cross-service.
function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * SERVICE ADMIN
 *
 * Gère l'accès à l'espace admin (indépendant des comptes utilisateurs, un
 * seul mot de passe partagé le temps qu'une vraie gestion d'administrateurs
 * existe) et les statistiques agrégées du tableau de bord.
 */

export type TimeRange = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<TimeRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

export interface StatOverviewItem {
  key: string;
  label: string;
  value: number;
  deltaPct: number;
}

export interface StatsOverview {
  users: StatOverviewItem;
  activities: StatOverviewItem;
  participations: StatOverviewItem;
  messages: StatOverviewItem;
  notifications: StatOverviewItem;
  territoriesActive: number;
}

export interface UserEvolutionPoint {
  date: string;
  count: number;
}

export interface TerritoryBreakdownItem {
  code: string;
  name: string;
  count: number;
  percent: number;
}

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

// Anti-brute-force minimal : le mot de passe admin est un secret partagé
// unique (pas de compte/email), donc particulièrement exposé aux tentatives
// répétées. À remplacer par une vraie gestion de comptes admin (cf. section
// "Administrateurs & rôles" du frontend) plutôt que d'étoffer ce compteur.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; windowStartedAt: number }>();

function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

function pctChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function countRows(query: Promise<{ count: unknown }[]>): Promise<number> {
  const rows = await query;
  return Number(rows[0]?.count ?? 0);
}

export class AdminAuthService {
  // Retombe sur ADMIN_PASSWORD_HASH tant qu'aucun reset n'a encore créé la
  // ligne en base — préserve les déploiements existants qui n'ont que la
  // variable d'env.
  static async getPasswordHash(): Promise<string | undefined> {
    const [row] = await db
      .select({ passwordHash: adminCredentials.passwordHash })
      .from(adminCredentials)
      .where(eq(adminCredentials.id, 1))
      .limit(1);

    return row?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH;
  }

  static async login(password: string, clientKey: string): Promise<string> {
    const attempt = loginAttempts.get(clientKey);
    const now = Date.now();

    if (attempt && now - attempt.windowStartedAt < WINDOW_MS && attempt.count >= MAX_ATTEMPTS) {
      throw new AdminAuthError(
        "Trop de tentatives, réessaie dans quelques minutes.",
        "TOO_MANY_ATTEMPTS",
        429
      );
    }

    const passwordHash = await AdminAuthService.getPasswordHash();
    const isValid = passwordHash ? await argon2.verify(passwordHash, password) : false;

    if (!isValid) {
      const nextCount = attempt && now - attempt.windowStartedAt < WINDOW_MS ? attempt.count + 1 : 1;
      loginAttempts.set(clientKey, { count: nextCount, windowStartedAt: attempt?.windowStartedAt ?? now });
      throw new AdminAuthError("Mot de passe incorrect", "INVALID_PASSWORD", 401);
    }

    loginAttempts.delete(clientKey);
    return signAdminToken();
  }

  /**
   * Demande de réinitialisation du mot de passe admin. Contrairement au
   * flux utilisateur, aucun email n'est fourni par l'appelant : le lien
   * part toujours vers ADMIN_RECOVERY_EMAIL (adresse fixe côté serveur),
   * donc aucun risque d'énumération à gérer ici.
   */
  static async requestPasswordReset(): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    const [existing] = await db
      .select({ passwordHash: adminCredentials.passwordHash })
      .from(adminCredentials)
      .where(eq(adminCredentials.id, 1))
      .limit(1);

    // Bootstrap : si la ligne n'existe pas encore, on l'initialise avec le
    // hash actuellement actif (l'env var) pour ne pas le perdre au premier
    // reset.
    const currentHash = existing?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH;
    if (!currentHash) {
      throw new AdminAuthError(
        "Aucun mot de passe admin configuré",
        "NO_PASSWORD_CONFIGURED",
        500
      );
    }

    await db
      .insert(adminCredentials)
      .values({
        id: 1,
        passwordHash: currentHash,
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      })
      .onConflictDoUpdate({
        target: adminCredentials.id,
        set: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt },
      });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/admin/reinitialiser-mot-de-passe?token=${rawToken}`;

    TerritoryService.getDefaultBrand()
      .then((brand) => sendAdminResetPasswordEmail(resetUrl, brand))
      .catch((err) => console.error("Erreur envoi email de réinitialisation admin:", err));
  }

  /**
   * Finalise une réinitialisation à partir du token reçu par email.
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new AdminAuthError(
        "Le mot de passe doit contenir au moins 8 caractères",
        "WEAK_PASSWORD",
        400
      );
    }

    const tokenHash = hashResetToken(token);

    const [row] = await db
      .select({ id: adminCredentials.id })
      .from(adminCredentials)
      .where(
        and(
          eq(adminCredentials.resetTokenHash, tokenHash),
          gt(adminCredentials.resetTokenExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!row) {
      throw new AdminAuthError(
        "Ce lien de réinitialisation est invalide ou a expiré",
        "INVALID_OR_EXPIRED_TOKEN",
        400
      );
    }

    const hashedPassword = await argon2.hash(newPassword);

    await db
      .update(adminCredentials)
      .set({
        passwordHash: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(adminCredentials.id, row.id));
  }
}

// Filtre territoire (optionnel) des statistiques et listes admin : "Tous"
// = aucun filtre. Les utilisateurs sont rattachés via user_territories,
// les activités via activities.territoryId ; participations et messages via
// l'activité concernée ; notifications via leur destinataire.
async function resolveTerritoryId(code?: string): Promise<string | undefined> {
  if (!code) return undefined;
  return (await TerritoryService.getByCode(code)).id;
}

function userInTerritory(territoryId: string | undefined) {
  return territoryId
    ? sql`${users.id} in (select user_id from user_territories where territory_id = ${territoryId})`
    : undefined;
}

function activityInTerritory(territoryId: string | undefined) {
  return territoryId ? eq(activities.territoryId, territoryId) : undefined;
}

function participationInTerritory(territoryId: string | undefined) {
  return territoryId
    ? sql`${participations.activityId} in (select id from activities where territory_id = ${territoryId})`
    : undefined;
}

function messageInTerritory(territoryId: string | undefined) {
  return territoryId
    ? sql`${messages.conversationsId} in (select c.id from conversations c join activities a on a.id = c.activity_id where a.territory_id = ${territoryId})`
    : undefined;
}

function notificationInTerritory(territoryId: string | undefined) {
  return territoryId
    ? sql`${notifications.usersId} in (select user_id from user_territories where territory_id = ${territoryId})`
    : undefined;
}

export class AdminStatsService {
  static async getOverview(range: TimeRange, territoryCode?: string): Promise<StatsOverview> {
    const territoryId = await resolveTerritoryId(territoryCode);
    const days = RANGE_DAYS[range];
    const now = new Date();
    const periodStart = daysAgo(days);
    const previousPeriodStart = daysAgo(days * 2);

    const countUsersUntil = (date: Date) =>
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(lte(users.createdAt, date), userInTerritory(territoryId)))
      );

    const countIn = (
      table: typeof activities | typeof participations | typeof messages | typeof notifications,
      extra: ReturnType<typeof sql> | ReturnType<typeof eq> | undefined,
      from: Date,
      to: Date,
      upperInclusive: boolean
    ) =>
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(table)
          .where(
            and(
              gte(table.createdAt, from),
              upperInclusive ? lte(table.createdAt, to) : lt(table.createdAt, to),
              extra
            )
          )
      );

    const [
      totalUsersNow,
      totalUsersAtPeriodStart,
      activitiesInPeriod,
      activitiesInPreviousPeriod,
      participationsInPeriod,
      participationsInPreviousPeriod,
      messagesInPeriod,
      messagesInPreviousPeriod,
      notificationsInPeriod,
      notificationsInPreviousPeriod,
      territoriesActive,
    ] = await Promise.all([
      countUsersUntil(now),
      countUsersUntil(periodStart),
      countIn(activities, activityInTerritory(territoryId), periodStart, now, true),
      countIn(activities, activityInTerritory(territoryId), previousPeriodStart, periodStart, false),
      countIn(participations, participationInTerritory(territoryId), periodStart, now, true),
      countIn(participations, participationInTerritory(territoryId), previousPeriodStart, periodStart, false),
      countIn(messages, messageInTerritory(territoryId), periodStart, now, true),
      countIn(messages, messageInTerritory(territoryId), previousPeriodStart, periodStart, false),
      countIn(notifications, notificationInTerritory(territoryId), periodStart, now, true),
      countIn(notifications, notificationInTerritory(territoryId), previousPeriodStart, periodStart, false),
      countRows(db.select({ count: sql<number>`count(*)` }).from(territories).where(eq(territories.isActive, true))),
    ]);

    return {
      users: {
        key: "users",
        label: "Utilisateurs",
        value: totalUsersNow,
        deltaPct: pctChange(totalUsersAtPeriodStart, totalUsersNow),
      },
      activities: {
        key: "activities",
        label: "Activités",
        value: activitiesInPeriod,
        deltaPct: pctChange(activitiesInPreviousPeriod, activitiesInPeriod),
      },
      participations: {
        key: "participations",
        label: "Participations",
        value: participationsInPeriod,
        deltaPct: pctChange(participationsInPreviousPeriod, participationsInPeriod),
      },
      messages: {
        key: "messages",
        label: "Messages",
        value: messagesInPeriod,
        deltaPct: pctChange(messagesInPreviousPeriod, messagesInPeriod),
      },
      notifications: {
        key: "notifications",
        label: "Notifications",
        value: notificationsInPeriod,
        deltaPct: pctChange(notificationsInPreviousPeriod, notificationsInPeriod),
      },
      territoriesActive,
    };
  }

  static async getUserEvolution(range: TimeRange, territoryCode?: string): Promise<UserEvolutionPoint[]> {
    const territoryId = await resolveTerritoryId(territoryCode);
    const days = RANGE_DAYS[range];
    const sampleCount = 8;
    const sampleDates: Date[] = [];

    for (let i = sampleCount; i >= 0; i--) {
      sampleDates.push(daysAgo(Math.round((i / sampleCount) * days)));
    }

    const counts = await Promise.all(
      sampleDates.map((date) =>
        countRows(
          db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(lte(users.createdAt, date), userInTerritory(territoryId)))
        )
      )
    );

    return sampleDates.map((date, i) => ({ date: date.toISOString(), count: counts[i] ?? 0 }));
  }

  static async getTerritoryBreakdown(): Promise<TerritoryBreakdownItem[]> {
    const [rows, totalUsers, usersWithDefaultTerritory] = await Promise.all([
      db
        .select({
          code: territories.code,
          name: territories.name,
          count: sql<number>`count(${userTerritories.userId})`,
        })
        .from(userTerritories)
        .innerJoin(territories, eq(territories.id, userTerritories.territoryId))
        .where(eq(userTerritories.isDefault, true))
        .groupBy(territories.id)
        .orderBy(desc(sql`count(${userTerritories.userId})`)),
      countRows(db.select({ count: sql<number>`count(*)` }).from(users)),
      countRows(
        db.select({ count: sql<number>`count(*)` }).from(userTerritories).where(eq(userTerritories.isDefault, true))
      ),
    ]);

    const others = Math.max(0, totalUsers - usersWithDefaultTerritory);

    const items: TerritoryBreakdownItem[] = rows.map((row) => ({
      code: row.code,
      name: row.name,
      count: Number(row.count),
      percent: totalUsers === 0 ? 0 : Math.round((Number(row.count) / totalUsers) * 100),
    }));

    if (others > 0) {
      items.push({
        code: "autres",
        name: "Autres",
        count: others,
        percent: totalUsers === 0 ? 0 : Math.round((others / totalUsers) * 100),
      });
    }

    return items;
  }
}

export interface AdminUserListItem {
  id: string;
  pseudo: string;
  city: string | null;
  avatar: string | null;
  createdAt: string;
  /** Codes des territoires dont l'utilisateur est membre. */
  territories: string[];
  email: string;
  /** Territoire principal (isDefault), null si aucun. */
  defaultTerritory: string | null;
  /** Fournisseurs de connexion liés ("google"). */
  providers: string[];
  activitiesCreated: number;
  participations: number;
}

export class AdminUsersService {
  static async list(territoryCode?: string): Promise<AdminUserListItem[]> {
    const territoryId = await resolveTerritoryId(territoryCode);

    const rows = await db
      .select({
        id: users.id,
        pseudo: users.pseudo,
        city: users.city,
        avatar: users.avatar,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(userInTerritory(territoryId))
      .orderBy(desc(users.createdAt));

    const [memberships, providerRows, createdRows, participationRows] = await Promise.all([
      db
        .select({ userId: userTerritories.userId, code: territories.code, isDefault: userTerritories.isDefault })
        .from(userTerritories)
        .innerJoin(territories, eq(territories.id, userTerritories.territoryId)),
      rowsOf(sql`select user_id, provider from social_accounts`),
      rowsOf(sql`select creator_id as user_id, count(*) as count from activities where creator_id is not null group by creator_id`),
      rowsOf(sql`select user_id, count(*) as count from participations group by user_id`),
    ]);

    const codesByUser = new Map<string, string[]>();
    const defaultByUser = new Map<string, string>();
    for (const m of memberships) {
      codesByUser.set(m.userId, [...(codesByUser.get(m.userId) ?? []), m.code]);
      if (m.isDefault) defaultByUser.set(m.userId, m.code);
    }
    const providersByUser = new Map<string, string[]>();
    for (const row of providerRows) {
      const id = String(row.user_id);
      providersByUser.set(id, [...(providersByUser.get(id) ?? []), String(row.provider)]);
    }
    const countMap = (list: Row[]) => new Map(list.map((row) => [String(row.user_id), num(row.count)]));
    const createdByUser = countMap(createdRows);
    const participationsByUser = countMap(participationRows);

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      territories: codesByUser.get(row.id) ?? [],
      defaultTerritory: defaultByUser.get(row.id) ?? null,
      providers: providersByUser.get(row.id) ?? [],
      activitiesCreated: createdByUser.get(row.id) ?? 0,
      participations: participationsByUser.get(row.id) ?? 0,
    }));
  }

  // Délègue entièrement à AccountDeletionService (même logique que le
  // parcours utilisateur, cf. chantier suppression de compte) : ce service
  // ne fait qu'exposer l'action côté admin, jamais sa propre suppression.
  static async delete(userId: string): Promise<void> {
    await AccountDeletionService.deleteAccount(userId, "ADMIN");
  }
}

export interface AdminActivityListItem {
  id: string;
  title: string;
  city: string;
  startDate: string;
  // Nullable : le créateur a pu supprimer son compte depuis (creatorId ->
  // null), l'activité reste listée.
  creatorPseudo: string | null;
  createdAt: string;
  sportName: string;
  creatorId: string | null;
  status: string;
  levelRequired: string;
  maxParticipants: number;
  /** Participants acceptés (même calcul que l'application). */
  participantsCount: number;
  pendingCount: number;
  territoryCode: string;
}

export class AdminActivitiesService {
  static async list(territoryCode?: string): Promise<AdminActivityListItem[]> {
    const territoryId = await resolveTerritoryId(territoryCode);

    const rows = await db
      .select({
        id: activities.id,
        title: activities.title,
        city: activities.city,
        startDate: activities.startDate,
        creatorPseudo: users.pseudo,
        createdAt: activities.createdAt,
        sportName: sports.name,
        creatorId: activities.creatorId,
        status: activities.status,
        levelRequired: activities.levelRequired,
        maxParticipants: activities.maxParticipants,
        territoryCode: territories.code,
        participantsCount: sql<number>`(select count(*) from participations p where p.activity_id = ${activities.id} and p.status = 'ACCEPTED')`,
        pendingCount: sql<number>`(select count(*) from participations p where p.activity_id = ${activities.id} and p.status = 'PENDING')`,
      })
      .from(activities)
      .leftJoin(users, eq(users.id, activities.creatorId))
      .innerJoin(sports, eq(sports.id, activities.sportId))
      .innerJoin(territories, eq(territories.id, activities.territoryId))
      .where(activityInTerritory(territoryId))
      .orderBy(desc(activities.createdAt));

    return rows.map((row) => ({
      ...row,
      participantsCount: Number(row.participantsCount),
      pendingCount: Number(row.pendingCount),
      startDate: row.startDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));
  }
}

// ---------------------------------------------------------------------------
// Vue détaillée de l'application (lecture seule) : indicateurs "depuis le
// lancement", fiches utilisateur et activité. Aucune écriture, aucun contenu
// de message exposé (seulement des compteurs) : l'admin voit l'activité de
// l'application, pas les conversations privées.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

async function rowsOf<T extends Row>(query: ReturnType<typeof sql>): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

function num(value: unknown): number {
  return Number(value ?? 0);
}

// Les colonnes "timestamp" (sans fuseau) contiennent de l'UTC : en SQL brut
// le driver les renvoie en texte sans suffixe, on les relit donc en UTC
// (même convention que Drizzle pour les requêtes typées).
function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  const hasZone = /(Z|[+-]\d{2}(:?\d{2})?)$/.test(text);
  return new Date(hasZone ? text : `${text.replace(" ", "T")}Z`).toISOString();
}

function isoOrNull(value: unknown): string | null {
  return value == null ? null : iso(value);
}

function activityScope(territoryId: string | undefined) {
  return territoryId ? sql`a.territory_id = ${territoryId}` : sql`true`;
}

function userScope(territoryId: string | undefined) {
  return territoryId
    ? sql`u.id in (select user_id from user_territories where territory_id = ${territoryId})`
    : sql`true`;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface StatsInsights {
  totals: {
    users: number;
    activities: number;
    participations: number;
    conversations: number;
    messages: number;
    photos: number;
    favorites: number;
    availabilities: number;
    pushUsers: number;
  };
  engagement: {
    /** Utilisateurs ayant créé ou rejoint au moins une activité. */
    activeUsers: number;
    usersWithAvatar: number;
    usersWithFavorites: number;
  };
  activities: {
    upcoming: number;
    past: number;
    byStatus: Record<string, number>;
    byLevel: Record<string, number>;
    /** Taux de remplissage moyen (participants acceptés / places), hors annulées. */
    fillRatePct: number;
    avgParticipants: number;
    carpoolEnabled: number;
  };
  participationsByStatus: Record<string, number>;
  signupMethods: NamedCount[];
  topSports: NamedCount[];
  favoriteSports: NamedCount[];
  activityCities: NamedCount[];
  userCities: NamedCount[];
  topOrganizers: { id: string; pseudo: string; avatar: string | null; count: number }[];
  topParticipants: { id: string; pseudo: string; avatar: string | null; count: number }[];
}

function toRecord(rows: Row[], key: string): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [String(row[key]), num(row.count)]));
}

function toNamed(rows: Row[], key: string): NamedCount[] {
  return rows.map((row) => ({ name: String(row[key]), count: num(row.count) }));
}

export class AdminInsightsService {
  static async getInsights(territoryCode?: string): Promise<StatsInsights> {
    const territoryId = await resolveTerritoryId(territoryCode);
    const inActivity = activityScope(territoryId);
    const inUsers = userScope(territoryId);
    const now = new Date().toISOString();

    const [
      totalsRows,
      engagementRows,
      timingRows,
      statusRows,
      levelRows,
      fillRows,
      participationRows,
      signupRows,
      sportRows,
      favoriteRows,
      activityCityRows,
      userCityRows,
      organizerRows,
      participantRows,
    ] = await Promise.all([
      rowsOf(sql`
        select
          (select count(*) from users u where ${inUsers}) as users,
          (select count(*) from activities a where ${inActivity}) as activities,
          (select count(*) from participations p join activities a on a.id = p.activity_id where ${inActivity}) as participations,
          (select count(*) from conversations c join activities a on a.id = c.activity_id where ${inActivity}) as conversations,
          (select count(*) from messages m join conversations c on c.id = m.conversations_id join activities a on a.id = c.activity_id where ${inActivity}) as messages,
          (select count(*) from activity_photos ph join activities a on a.id = ph.activity_id where ${inActivity}) as photos,
          (select count(*) from sport_favorites f join users u on u.id = f.user_id where ${inUsers}) as favorites,
          (select count(*) from availabilities av join users u on u.id = av.user_id where ${inUsers}) as availabilities,
          (select count(distinct ps.user_id) from push_subscriptions ps join users u on u.id = ps.user_id where ${inUsers}) as push_users
      `),
      rowsOf(sql`
        select
          count(*) filter (
            where exists (select 1 from activities x where x.creator_id = u.id)
               or exists (select 1 from participations x where x.user_id = u.id)
          ) as active_users,
          count(*) filter (where u.avatar is not null) as with_avatar,
          count(*) filter (where exists (select 1 from sport_favorites x where x.user_id = u.id)) as with_favorites
        from users u where ${inUsers}
      `),
      rowsOf(sql`
        select
          count(*) filter (where a.start_date >= ${now}::timestamp and a.status <> 'CANCELLED') as upcoming,
          count(*) filter (where a.start_date < ${now}::timestamp and a.status <> 'CANCELLED') as past,
          count(*) filter (where a.carpool_enabled) as carpool
        from activities a where ${inActivity}
      `),
      rowsOf(sql`select a.status, count(*) as count from activities a where ${inActivity} group by a.status`),
      rowsOf(sql`select a.level_required, count(*) as count from activities a where ${inActivity} group by a.level_required`),
      rowsOf(sql`
        select
          coalesce(round(avg(least(1.0, coalesce(acc.n, 0)::numeric / nullif(a.max_participants, 0))) * 100), 0) as fill_rate,
          coalesce(round(avg(coalesce(acc.n, 0)), 1), 0) as avg_participants
        from activities a
        left join (
          select activity_id, count(*) as n from participations where status = 'ACCEPTED' group by activity_id
        ) acc on acc.activity_id = a.id
        where ${inActivity} and a.status <> 'CANCELLED'
      `),
      rowsOf(sql`
        select p.status, count(*) as count
        from participations p join activities a on a.id = p.activity_id
        where ${inActivity} group by p.status
      `),
      rowsOf(sql`
        select coalesce(sa.provider, 'email') as method, count(distinct u.id) as count
        from users u left join social_accounts sa on sa.user_id = u.id
        where ${inUsers} group by 1 order by 2 desc
      `),
      rowsOf(sql`
        select s.name, count(*) as count
        from activities a join sports s on s.id = a.sport_id
        where ${inActivity} group by s.name order by count desc, s.name limit 8
      `),
      rowsOf(sql`
        select s.name, count(*) as count
        from sport_favorites f join sports s on s.id = f.sport_id join users u on u.id = f.user_id
        where ${inUsers} group by s.name order by count desc, s.name limit 8
      `),
      rowsOf(sql`
        select a.city, count(*) as count from activities a
        where ${inActivity} group by a.city order by count desc, a.city limit 8
      `),
      rowsOf(sql`
        select u.city, count(*) as count from users u
        where ${inUsers} and u.city is not null and u.city <> ''
        group by u.city order by count desc, u.city limit 8
      `),
      rowsOf(sql`
        select u.id, u.pseudo, u.avatar, count(*) as count
        from activities a join users u on u.id = a.creator_id
        where ${inActivity} group by u.id order by count desc, u.pseudo limit 5
      `),
      rowsOf(sql`
        select u.id, u.pseudo, u.avatar, count(*) as count
        from participations p join users u on u.id = p.user_id join activities a on a.id = p.activity_id
        where ${inActivity} and p.status = 'ACCEPTED'
        group by u.id order by count desc, u.pseudo limit 5
      `),
    ]);

    const totals = totalsRows[0] ?? {};
    const engagement = engagementRows[0] ?? {};
    const timing = timingRows[0] ?? {};
    const fill = fillRows[0] ?? {};
    const people = (rows: Row[]) =>
      rows.map((row) => ({
        id: String(row.id),
        pseudo: String(row.pseudo),
        avatar: (row.avatar as string | null) ?? null,
        count: num(row.count),
      }));

    return {
      totals: {
        users: num(totals.users),
        activities: num(totals.activities),
        participations: num(totals.participations),
        conversations: num(totals.conversations),
        messages: num(totals.messages),
        photos: num(totals.photos),
        favorites: num(totals.favorites),
        availabilities: num(totals.availabilities),
        pushUsers: num(totals.push_users),
      },
      engagement: {
        activeUsers: num(engagement.active_users),
        usersWithAvatar: num(engagement.with_avatar),
        usersWithFavorites: num(engagement.with_favorites),
      },
      activities: {
        upcoming: num(timing.upcoming),
        past: num(timing.past),
        byStatus: toRecord(statusRows, "status"),
        byLevel: toRecord(levelRows, "level_required"),
        fillRatePct: num(fill.fill_rate),
        avgParticipants: num(fill.avg_participants),
        carpoolEnabled: num(timing.carpool),
      },
      participationsByStatus: toRecord(participationRows, "status"),
      signupMethods: toNamed(signupRows, "method"),
      topSports: toNamed(sportRows, "name"),
      favoriteSports: toNamed(favoriteRows, "name"),
      activityCities: toNamed(activityCityRows, "city"),
      userCities: toNamed(userCityRows, "city"),
      topOrganizers: people(organizerRows),
      topParticipants: people(participantRows),
    };
  }
}

export class AdminDetailError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 404
  ) {
    super(message);
    this.name = "AdminDetailError";
  }
}

export interface AdminUserDetail {
  id: string;
  email: string;
  pseudo: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  hasPassword: boolean;
  providers: string[];
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pushEnabled: boolean;
  territories: { code: string; name: string; isDefault: boolean; joinedAt: string }[];
  favoriteSports: string[];
  availabilities: { weekday: string; startTime: string; endTime: string }[];
  counts: {
    activitiesCreated: number;
    participations: number;
    participationsAccepted: number;
    messagesSent: number;
    photos: number;
    notificationsUnread: number;
  };
  activitiesCreated: {
    id: string;
    title: string;
    sportName: string;
    city: string;
    startDate: string;
    status: string;
    participantsCount: number;
    maxParticipants: number;
  }[];
  participations: {
    activityId: string;
    title: string;
    sportName: string;
    startDate: string;
    activityStatus: string;
    status: string;
    createdAt: string;
  }[];
}

const WEEKDAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export class AdminUserDetailService {
  static async get(userId: string): Promise<AdminUserDetail> {
    const [user] = await rowsOf(sql`
      select id, email, pseudo, city, headline, looking_for, open_to, avatar, cover_photo,
        (password is not null) as has_password, terms_accepted_at, created_at, updated_at
      from users where id = ${userId}
    `);
    if (!user) throw new AdminDetailError("Utilisateur introuvable", "USER_NOT_FOUND");

    const [
      providerRows,
      territoryRows,
      favoriteRows,
      availabilityRows,
      countRows_,
      createdRows,
      participationRows,
    ] = await Promise.all([
      rowsOf(sql`select provider from social_accounts where user_id = ${userId} order by provider`),
      rowsOf(sql`
        select t.code, t.name, ut.is_default, ut.joined_at
        from user_territories ut join territories t on t.id = ut.territory_id
        where ut.user_id = ${userId} order by ut.is_default desc, t.code
      `),
      rowsOf(sql`
        select s.name from sport_favorites f join sports s on s.id = f.sport_id
        where f.user_id = ${userId} order by s.name
      `),
      rowsOf(sql`select weekday, start_time, end_time from availabilities where user_id = ${userId}`),
      rowsOf(sql`
        select
          (select count(*) from activities where creator_id = ${userId}) as created,
          (select count(*) from participations where user_id = ${userId}) as participations,
          (select count(*) from participations where user_id = ${userId} and status = 'ACCEPTED') as accepted,
          (select count(*) from messages where users_id = ${userId}) as messages,
          (select count(*) from activity_photos where uploader_id = ${userId}) as photos,
          (select count(*) from notifications where users_id = ${userId} and est_lu = false) as unread,
          (select count(*) from push_subscriptions where user_id = ${userId}) as push
      `),
      rowsOf(sql`
        select a.id, a.title, s.name as sport_name, a.city, a.start_date, a.status, a.max_participants,
          (select count(*) from participations p where p.activity_id = a.id and p.status = 'ACCEPTED') as participants
        from activities a join sports s on s.id = a.sport_id
        where a.creator_id = ${userId} order by a.start_date desc
      `),
      rowsOf(sql`
        select a.id as activity_id, a.title, s.name as sport_name, a.start_date, a.status as activity_status,
          p.status, p.created_at
        from participations p join activities a on a.id = p.activity_id join sports s on s.id = a.sport_id
        where p.user_id = ${userId} order by a.start_date desc
      `),
    ]);

    const counts = countRows_[0] ?? {};

    return {
      id: String(user.id),
      email: String(user.email),
      pseudo: String(user.pseudo),
      city: (user.city as string | null) ?? null,
      headline: (user.headline as string | null) ?? null,
      lookingFor: (user.looking_for as string | null) ?? null,
      openTo: (user.open_to as string | null) ?? null,
      avatar: (user.avatar as string | null) ?? null,
      coverPhoto: (user.cover_photo as string | null) ?? null,
      hasPassword: Boolean(user.has_password),
      providers: providerRows.map((row) => String(row.provider)),
      termsAcceptedAt: isoOrNull(user.terms_accepted_at),
      createdAt: iso(user.created_at),
      updatedAt: iso(user.updated_at),
      pushEnabled: num(counts.push) > 0,
      territories: territoryRows.map((row) => ({
        code: String(row.code),
        name: String(row.name),
        isDefault: Boolean(row.is_default),
        joinedAt: iso(row.joined_at),
      })),
      favoriteSports: favoriteRows.map((row) => String(row.name)),
      availabilities: availabilityRows
        .map((row) => ({
          weekday: String(row.weekday),
          startTime: String(row.start_time),
          endTime: String(row.end_time),
        }))
        .sort(
          (a, b) =>
            WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday) ||
            a.startTime.localeCompare(b.startTime)
        ),
      counts: {
        activitiesCreated: num(counts.created),
        participations: num(counts.participations),
        participationsAccepted: num(counts.accepted),
        messagesSent: num(counts.messages),
        photos: num(counts.photos),
        notificationsUnread: num(counts.unread),
      },
      activitiesCreated: createdRows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        sportName: String(row.sport_name),
        city: String(row.city),
        startDate: iso(row.start_date),
        status: String(row.status),
        participantsCount: num(row.participants),
        maxParticipants: num(row.max_participants),
      })),
      participations: participationRows.map((row) => ({
        activityId: String(row.activity_id),
        title: String(row.title),
        sportName: String(row.sport_name),
        startDate: iso(row.start_date),
        activityStatus: String(row.activity_status),
        status: String(row.status),
        createdAt: iso(row.created_at),
      })),
    };
  }
}

export interface AdminActivityDetail {
  id: string;
  title: string;
  description: string | null;
  sportName: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  levelRequired: string;
  maxParticipants: number;
  status: string;
  carpoolEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  territory: { code: string; name: string };
  creator: { id: string; pseudo: string; avatar: string | null } | null;
  participants: {
    userId: string;
    pseudo: string;
    avatar: string | null;
    /** Territoire principal du participant (avatar par défaut). */
    defaultTerritory: string | null;
    status: string;
    carpoolRequested: boolean;
    createdAt: string;
  }[];
  counts: {
    accepted: number;
    pending: number;
    refused: number;
    conversations: number;
    messages: number;
    photos: number;
  };
  lastMessageAt: string | null;
}

export class AdminActivityDetailService {
  static async get(activityId: string): Promise<AdminActivityDetail> {
    const [activity] = await rowsOf(sql`
      select a.id, a.title, a.description, s.name as sport_name, a.city, a.latitude, a.longitude,
        a.start_date, a.level_required, a.max_participants, a.status, a.carpool_enabled,
        a.created_at, a.updated_at, t.code as territory_code, t.name as territory_name,
        u.id as creator_id, u.pseudo as creator_pseudo, u.avatar as creator_avatar
      from activities a
      join sports s on s.id = a.sport_id
      join territories t on t.id = a.territory_id
      left join users u on u.id = a.creator_id
      where a.id = ${activityId}
    `);
    if (!activity) throw new AdminDetailError("Activité introuvable", "ACTIVITY_NOT_FOUND");

    const [participantRows, countRows_] = await Promise.all([
      rowsOf(sql`
        select u.id as user_id, u.pseudo, u.avatar, p.status, p.carpool_requested, p.created_at,
          (select t.code from user_territories ut join territories t on t.id = ut.territory_id
            where ut.user_id = u.id and ut.is_default limit 1) as default_territory
        from participations p join users u on u.id = p.user_id
        where p.activity_id = ${activityId}
        order by case p.status when 'ACCEPTED' then 0 when 'PENDING' then 1 else 2 end, p.created_at
      `),
      rowsOf(sql`
        select
          (select count(*) from conversations where activity_id = ${activityId}) as conversations,
          (select count(*) from messages m join conversations c on c.id = m.conversations_id where c.activity_id = ${activityId}) as messages,
          (select max(m.created_at) from messages m join conversations c on c.id = m.conversations_id where c.activity_id = ${activityId}) as last_message_at,
          (select count(*) from activity_photos where activity_id = ${activityId}) as photos
      `),
    ]);

    const counts = countRows_[0] ?? {};
    const byStatus = (status: string) => participantRows.filter((row) => row.status === status).length;

    return {
      id: String(activity.id),
      title: String(activity.title),
      description: (activity.description as string | null) ?? null,
      sportName: String(activity.sport_name),
      city: String(activity.city),
      latitude: activity.latitude == null ? null : Number(activity.latitude),
      longitude: activity.longitude == null ? null : Number(activity.longitude),
      startDate: iso(activity.start_date),
      levelRequired: String(activity.level_required),
      maxParticipants: num(activity.max_participants),
      status: String(activity.status),
      carpoolEnabled: Boolean(activity.carpool_enabled),
      createdAt: iso(activity.created_at),
      updatedAt: iso(activity.updated_at),
      territory: { code: String(activity.territory_code), name: String(activity.territory_name) },
      creator: activity.creator_id
        ? {
            id: String(activity.creator_id),
            pseudo: String(activity.creator_pseudo),
            avatar: (activity.creator_avatar as string | null) ?? null,
          }
        : null,
      participants: participantRows.map((row) => ({
        userId: String(row.user_id),
        pseudo: String(row.pseudo),
        avatar: (row.avatar as string | null) ?? null,
        defaultTerritory: (row.default_territory as string | null) ?? null,
        status: String(row.status),
        carpoolRequested: Boolean(row.carpool_requested),
        createdAt: iso(row.created_at),
      })),
      counts: {
        accepted: byStatus("ACCEPTED"),
        pending: byStatus("PENDING"),
        refused: byStatus("REFUSED"),
        conversations: num(counts.conversations),
        messages: num(counts.messages),
        photos: num(counts.photos),
      },
      lastMessageAt: isoOrNull(counts.last_message_at),
    };
  }
}
