import "dotenv/config";
import argon2 from "argon2";
import { and, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  messages,
  notifications,
  participations,
  territories,
  userTerritories,
  users,
} from "../db/schema.js";
import { signAdminToken } from "../utils/adminJwt.js";

const db = drizzle(process.env.DATABASE_URL!);

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

    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const isValid = passwordHash ? await argon2.verify(passwordHash, password) : false;

    if (!isValid) {
      const nextCount = attempt && now - attempt.windowStartedAt < WINDOW_MS ? attempt.count + 1 : 1;
      loginAttempts.set(clientKey, { count: nextCount, windowStartedAt: attempt?.windowStartedAt ?? now });
      throw new AdminAuthError("Mot de passe incorrect", "INVALID_PASSWORD", 401);
    }

    loginAttempts.delete(clientKey);
    return signAdminToken();
  }
}

export class AdminStatsService {
  static async getOverview(range: TimeRange): Promise<StatsOverview> {
    const days = RANGE_DAYS[range];
    const now = new Date();
    const periodStart = daysAgo(days);
    const previousPeriodStart = daysAgo(days * 2);

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
      countRows(db.select({ count: sql<number>`count(*)` }).from(users).where(lte(users.createdAt, now))),
      countRows(
        db.select({ count: sql<number>`count(*)` }).from(users).where(lte(users.createdAt, periodStart))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(activities)
          .where(and(gte(activities.createdAt, periodStart), lte(activities.createdAt, now)))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(activities)
          .where(and(gte(activities.createdAt, previousPeriodStart), lt(activities.createdAt, periodStart)))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(participations)
          .where(and(gte(participations.createdAt, periodStart), lte(participations.createdAt, now)))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(participations)
          .where(
            and(gte(participations.createdAt, previousPeriodStart), lt(participations.createdAt, periodStart))
          )
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(and(gte(messages.createdAt, periodStart), lte(messages.createdAt, now)))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(and(gte(messages.createdAt, previousPeriodStart), lt(messages.createdAt, periodStart)))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(and(gte(notifications.createdAt, periodStart), lte(notifications.createdAt, now)))
      ),
      countRows(
        db
          .select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(
            and(gte(notifications.createdAt, previousPeriodStart), lt(notifications.createdAt, periodStart))
          )
      ),
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

  static async getUserEvolution(range: TimeRange): Promise<UserEvolutionPoint[]> {
    const days = RANGE_DAYS[range];
    const sampleCount = 8;
    const sampleDates: Date[] = [];

    for (let i = sampleCount; i >= 0; i--) {
      sampleDates.push(daysAgo(Math.round((i / sampleCount) * days)));
    }

    const counts = await Promise.all(
      sampleDates.map((date) =>
        countRows(db.select({ count: sql<number>`count(*)` }).from(users).where(lte(users.createdAt, date)))
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
