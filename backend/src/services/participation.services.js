import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, participations } from "../db/schema.js";
const db = drizzle(process.env.DATABASE_URL);
// Erreurs métier personnalisées
export class ParticipationError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "ParticipationError";
    }
}
async function getParticipationOrThrow(participationId) {
    const [participation] = await db
        .select()
        .from(participations)
        .where(eq(participations.id, participationId))
        .limit(1);
    if (!participation) {
        throw new ParticipationError("Demande de participation non trouvée", "PARTICIPATION_NOT_FOUND", 404);
    }
    return participation;
}
async function getActivityOrThrow(activityId) {
    const [activity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, activityId))
        .limit(1);
    if (!activity) {
        throw new ParticipationError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
    }
    return activity;
}
export class ParticipationService {
    /**
     * Demande pour rejoindre une activité
     */
    static async joinActivity(userId, activityId) {
        const activity = await getActivityOrThrow(activityId);
        if (activity.creatorId === userId) {
            throw new ParticipationError("Vous ne pouvez pas rejoindre votre propre activité", "CANNOT_JOIN_OWN_ACTIVITY", 403);
        }
        const [existingParticipation] = await db
            .select({ id: participations.id })
            .from(participations)
            .where(and(eq(participations.userId, userId), eq(participations.activityId, activityId)))
            .limit(1);
        if (existingParticipation) {
            throw new ParticipationError("Vous avez déjà demandé à rejoindre cette activité", "ALREADY_REQUESTED", 409);
        }
        const [newParticipation] = await db
            .insert(participations)
            .values({ userId, activityId })
            .returning();
        if (!newParticipation) {
            throw new ParticipationError("Erreur lors de la création de la demande de participation", "PARTICIPATION_CREATION_FAILED", 500);
        }
        return newParticipation;
    }
    /**
     * Acceptation d'une demande de participation (réservé au créateur de l'activité)
     */
    static async acceptParticipation(participationId, requesterId) {
        const participation = await getParticipationOrThrow(participationId);
        const activity = await getActivityOrThrow(participation.activityId);
        if (activity.creatorId !== requesterId) {
            throw new ParticipationError("Seul le créateur de l'activité peut accepter cette demande", "FORBIDDEN", 403);
        }
        const acceptedParticipants = await db
            .select({ id: participations.id })
            .from(participations)
            .where(and(eq(participations.activityId, activity.id), eq(participations.status, "ACCEPTED")));
        if (acceptedParticipants.length >= activity.maxParticipants) {
            throw new ParticipationError("Le nombre maximum de participants est atteint", "ACTIVITY_FULL", 409);
        }
        const [updatedParticipation] = await db
            .update(participations)
            .set({ status: "ACCEPTED" })
            .where(eq(participations.id, participationId))
            .returning();
        if (!updatedParticipation) {
            throw new ParticipationError("Demande de participation non trouvée", "PARTICIPATION_NOT_FOUND", 404);
        }
        return updatedParticipation;
    }
    /**
     * Refus d'une demande de participation (réservé au créateur de l'activité)
     */
    static async refuseParticipation(participationId, requesterId) {
        const participation = await getParticipationOrThrow(participationId);
        const activity = await getActivityOrThrow(participation.activityId);
        if (activity.creatorId !== requesterId) {
            throw new ParticipationError("Seul le créateur de l'activité peut refuser cette demande", "FORBIDDEN", 403);
        }
        const [updatedParticipation] = await db
            .update(participations)
            .set({ status: "REFUSED" })
            .where(eq(participations.id, participationId))
            .returning();
        if (!updatedParticipation) {
            throw new ParticipationError("Demande de participation non trouvée", "PARTICIPATION_NOT_FOUND", 404);
        }
        return updatedParticipation;
    }
    /**
     * Annulation d'une demande de participation (réservé à son auteur)
     */
    static async cancelParticipation(participationId, requesterId) {
        const participation = await getParticipationOrThrow(participationId);
        if (participation.userId !== requesterId) {
            throw new ParticipationError("Seul l'auteur de la demande peut l'annuler", "FORBIDDEN", 403);
        }
        await db
            .delete(participations)
            .where(eq(participations.id, participationId));
    }
}
//# sourceMappingURL=participation.services.js.map