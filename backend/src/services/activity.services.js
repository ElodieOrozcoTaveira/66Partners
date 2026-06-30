import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, activitiesStatusEnum, sportLevelEnum, } from "../db/schema.js";
const db = drizzle(process.env.DATABASE_URL);
// Erreurs métier personnalisées
export class ActivityError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "ActivityError";
    }
}
export class ActivityService {
    /**
     * Création d'une nouvelle activité
     */
    static async createActivity(creatorId, data) {
        const [newActivity] = await db
            .insert(activities)
            .values({
            ...data,
            creatorId,
        })
            .returning();
        if (!newActivity) {
            throw new ActivityError("Erreur lors de la création de l'activité", "ACTIVITY_CREATION_FAILED", 500);
        }
        return newActivity;
    }
    /**
     * Récupération d'une activité par son ID
     */
    static async getActivityById(activityId) {
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
    static async listActivities(filters = {}) {
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
    static async updateActivity(activityId, requesterId, data) {
        const activity = await ActivityService.getActivityById(activityId);
        if (!activity) {
            throw new ActivityError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
        }
        if (activity.creatorId !== requesterId) {
            throw new ActivityError("Seul le créateur peut modifier cette activité", "FORBIDDEN", 403);
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
    static async deleteActivity(activityId, requesterId) {
        const activity = await ActivityService.getActivityById(activityId);
        if (!activity) {
            throw new ActivityError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
        }
        if (activity.creatorId !== requesterId) {
            throw new ActivityError("Seul le créateur peut supprimer cette activité", "FORBIDDEN", 403);
        }
        await db.delete(activities).where(eq(activities.id, activityId));
    }
}
//# sourceMappingURL=activity.services.js.map