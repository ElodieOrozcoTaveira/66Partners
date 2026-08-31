import "dotenv/config";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  activitiesStatusEnum,
  participations,
  sportLevelEnum,
  sports,
  territories,
} from "../db/schema.js";
import { TerritoryService } from "./territory.services.js";

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
  /** Ne retourne que les activités où cet utilisateur a une participation acceptée */
  participantId?: string;
  /** Code du territoire (ex: "66") */
  territory?: string;
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

    // Le territoire n'est jamais accepté tel quel : soit il est résolu depuis
    // le territoire par défaut du créateur, soit — s'il est fourni par le
    // client — son appartenance est vérifiée côté serveur avant d'être utilisée.
    let territoryId = data.territoryId;

    if (territoryId) {
      const isMember = await TerritoryService.isUserMemberOf(creatorId, territoryId);
      if (!isMember) {
        throw new ActivityError(
          "Vous n'êtes pas membre de ce territoire",
          "NOT_TERRITORY_MEMBER",
          403
        );
      }
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
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        sportName: sports.name,
        participantsCount: sql<number>`count(distinct case when ${participations.status} = 'ACCEPTED' then ${participations.id} end)`,
      })
      .from(activities)
      .innerJoin(sports, eq(sports.id, activities.sportId))
      .leftJoin(participations, eq(participations.activityId, activities.id))
      .where(eq(activities.id, activityId))
      .groupBy(activities.id, sports.name)
      .limit(1);

    if (!activity) return null;

    return { ...activity, participantsCount: Number(activity.participantsCount) };
  }

  /**
   * Liste des activités, avec filtres optionnels. Inclut le nom du sport et
   * le nombre réel de participants acceptés (calculé à la volée).
   */
  static async listActivities(filters: ActivityFilters = {}): Promise<ActivityWithDetails[]> {
    const { city, sportId, status, participantId, territory } = filters;

    const conditions = [
      city ? eq(activities.city, city) : undefined,
      sportId ? eq(activities.sportId, sportId) : undefined,
      status ? eq(activities.status, status) : undefined,
      territory ? eq(territories.code, territory) : undefined,
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
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        sportName: sports.name,
        participantsCount: sql<number>`count(distinct case when ${participations.status} = 'ACCEPTED' then ${participations.id} end)`,
      })
      .from(activities)
      .innerJoin(sports, eq(sports.id, activities.sportId))
      .innerJoin(territories, eq(territories.id, activities.territoryId))
      .leftJoin(participations, eq(participations.activityId, activities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(activities.id, sports.name)
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
