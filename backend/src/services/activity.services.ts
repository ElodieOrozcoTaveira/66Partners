import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  activitiesStatusEnum,
  sportLevelEnum,
} from "../db/schema.js";

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
}

export interface ActivityFilters {
  city?: string;
  sportId?: string;
  status?: ActivityStatus;
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

    const [newActivity] = await db
      .insert(activities)
      .values({
        ...data,
        creatorId,
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
  static async getActivityById(activityId: string): Promise<Activity | null> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    return activity ?? null;
  }

  /**
   * Liste des activités, avec filtres optionnels
   */
  static async listActivities(filters: ActivityFilters = {}): Promise<Activity[]> {
    const { city, sportId, status } = filters;

    const conditions = [
      city ? eq(activities.city, city) : undefined,
      sportId ? eq(activities.sportId, sportId) : undefined,
      status ? eq(activities.status, status) : undefined,
    ].filter((condition) => condition !== undefined);

    return db
      .select()
      .from(activities)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
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

    await db.delete(activities).where(eq(activities.id, activityId));
  }
}
