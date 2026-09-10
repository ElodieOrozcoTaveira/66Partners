import "dotenv/config";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, conversations, participations, users } from "../db/schema.js";
import { isUniqueViolation } from "../utils/db-errors.js";
import { NotificationService } from "./notification.services.js";
import { TerritoryService } from "./territory.services.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE PARTICIPATION
 *
 * Contient la logique métier liée aux demandes de participation
 * à une activité (rejoindre, accepter, refuser, annuler).
 */

export type Participation = typeof participations.$inferSelect;
export type ParticipationWithUser = Participation & {
  userPseudo: string;
  userAvatar: string | null;
};

// Erreurs métier personnalisées
export class ParticipationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ParticipationError";
  }
}

async function getParticipationOrThrow(
  participationId: string
): Promise<Participation> {
  const [participation] = await db
    .select()
    .from(participations)
    .where(eq(participations.id, participationId))
    .limit(1);

  if (!participation) {
    throw new ParticipationError(
      "Demande de participation non trouvée",
      "PARTICIPATION_NOT_FOUND",
      404
    );
  }

  return participation;
}

async function getActivityOrThrow(activityId: string) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new ParticipationError(
      "Activité non trouvée",
      "ACTIVITY_NOT_FOUND",
      404
    );
  }

  return activity;
}

export class ParticipationService {
  /**
   * Demande pour rejoindre une activité
   */
  static async joinActivity(
    userId: string,
    activityId: string
  ): Promise<Participation> {
    const activity = await getActivityOrThrow(activityId);

    if (activity.creatorId === userId) {
      throw new ParticipationError(
        "Vous ne pouvez pas rejoindre votre propre activité",
        "CANNOT_JOIN_OWN_ACTIVITY",
        403
      );
    }

    const isMember = await TerritoryService.isUserMemberOf(userId, activity.territoryId);
    if (!isMember) {
      throw new ParticipationError(
        "Vous n'êtes pas membre du territoire de cette activité",
        "NOT_TERRITORY_MEMBER",
        403
      );
    }

    const [existingParticipation] = await db
      .select({ id: participations.id })
      .from(participations)
      .where(
        and(
          eq(participations.userId, userId),
          eq(participations.activityId, activityId)
        )
      )
      .limit(1);

    if (existingParticipation) {
      throw new ParticipationError(
        "Vous avez déjà demandé à rejoindre cette activité",
        "ALREADY_REQUESTED",
        409
      );
    }

    let newParticipation: Participation | undefined;
    try {
      [newParticipation] = await db
        .insert(participations)
        .values({ userId, activityId })
        .returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ParticipationError(
          "Vous avez déjà demandé à rejoindre cette activité",
          "ALREADY_REQUESTED",
          409
        );
      }
      throw error;
    }

    if (!newParticipation) {
      throw new ParticipationError(
        "Erreur lors de la création de la demande de participation",
        "PARTICIPATION_CREATION_FAILED",
        500
      );
    }

    const [requester] = await db
      .select({ pseudo: users.pseudo })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    NotificationService.create({
      usersId: activity.creatorId,
      type: "PARTICIPATION_REQUESTED",
      contenu: `${requester?.pseudo ?? "Quelqu'un"} veut rejoindre "${activity.title}"`,
      activityId: activity.id,
    }).catch((err) =>
      console.error("Erreur création notification (demande de participation):", err),
    );

    return newParticipation;
  }

  /**
   * Acceptation d'une demande de participation (réservé au créateur de l'activité)
   */
  static async acceptParticipation(
    participationId: string,
    requesterId: string
  ): Promise<Participation> {
    const participation = await getParticipationOrThrow(participationId);
    const activity = await getActivityOrThrow(participation.activityId);

    if (activity.creatorId !== requesterId) {
      throw new ParticipationError(
        "Seul le créateur de l'activité peut accepter cette demande",
        "FORBIDDEN",
        403
      );
    }

    const acceptedParticipants = await db
      .select({ id: participations.id })
      .from(participations)
      .where(
        and(
          eq(participations.activityId, activity.id),
          eq(participations.status, "ACCEPTED")
        )
      );

    if (acceptedParticipants.length >= activity.maxParticipants) {
      throw new ParticipationError(
        "Le nombre maximum de participants est atteint",
        "ACTIVITY_FULL",
        409
      );
    }

    const [updatedParticipation] = await db
      .update(participations)
      .set({ status: "ACCEPTED" })
      .where(eq(participations.id, participationId))
      .returning();

    if (!updatedParticipation) {
      throw new ParticipationError(
        "Demande de participation non trouvée",
        "PARTICIPATION_NOT_FOUND",
        404
      );
    }

    // Ouvre la conversation de groupe dès la première acceptation
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.activityId, activity.id))
      .limit(1);

    if (!existingConversation) {
      await db.insert(conversations).values({ activityId: activity.id });
    }

    NotificationService.create({
      usersId: updatedParticipation.userId,
      type: "PARTICIPATION_ACCEPTED",
      contenu: `Ta demande pour rejoindre "${activity.title}" a été acceptée !`,
      activityId: activity.id,
    }).catch((err) =>
      console.error("Erreur création notification (participation acceptée):", err),
    );

    return updatedParticipation;
  }

  /**
   * Refus d'une demande de participation (réservé au créateur de l'activité)
   */
  static async refuseParticipation(
    participationId: string,
    requesterId: string
  ): Promise<Participation> {
    const participation = await getParticipationOrThrow(participationId);
    const activity = await getActivityOrThrow(participation.activityId);

    if (activity.creatorId !== requesterId) {
      throw new ParticipationError(
        "Seul le créateur de l'activité peut refuser cette demande",
        "FORBIDDEN",
        403
      );
    }

    const [updatedParticipation] = await db
      .update(participations)
      .set({ status: "REFUSED" })
      .where(eq(participations.id, participationId))
      .returning();

    if (!updatedParticipation) {
      throw new ParticipationError(
        "Demande de participation non trouvée",
        "PARTICIPATION_NOT_FOUND",
        404
      );
    }

    return updatedParticipation;
  }

  /**
   * Annulation d'une demande de participation (réservé à son auteur)
   */
  static async cancelParticipation(
    participationId: string,
    requesterId: string
  ): Promise<void> {
    const participation = await getParticipationOrThrow(participationId);

    if (participation.userId !== requesterId) {
      throw new ParticipationError(
        "Seul l'auteur de la demande peut l'annuler",
        "FORBIDDEN",
        403
      );
    }

    await db
      .delete(participations)
      .where(eq(participations.id, participationId));
  }

  /**
   * Statut de participation de l'utilisateur pour une activité (ou null).
   */
  static async getMine(
    activityId: string,
    userId: string
  ): Promise<Participation | null> {
    const [participation] = await db
      .select()
      .from(participations)
      .where(
        and(
          eq(participations.activityId, activityId),
          eq(participations.userId, userId)
        )
      )
      .limit(1);

    return participation ?? null;
  }

  /**
   * Liste des demandes de participation d'une activité.
   * - Le créateur voit toutes les demandes (en attente, acceptées, refusées),
   *   nécessaire pour la modération (accepter/refuser).
   * - Un participant accepté voit uniquement les participants déjà acceptés
   *   (avec qui il va pratiquer), jamais les demandes en attente/refusées
   *   d'autres personnes.
   * - Toute autre personne (non authentifiée ou non liée à l'activité) est
   *   bloquée ici, côté serveur — ne pas se reposer uniquement sur le
   *   masquage frontend.
   */
  static async listForActivity(
    activityId: string,
    requesterId: string
  ): Promise<ParticipationWithUser[]> {
    const activity = await getActivityOrThrow(activityId);
    const isCreator = activity.creatorId === requesterId;

    if (!isCreator) {
      const [ownParticipation] = await db
        .select()
        .from(participations)
        .where(
          and(
            eq(participations.activityId, activityId),
            eq(participations.userId, requesterId),
            eq(participations.status, "ACCEPTED")
          )
        )
        .limit(1);

      if (!ownParticipation) {
        throw new ParticipationError(
          "Seuls le créateur et les participants de l'activité peuvent voir cette liste",
          "FORBIDDEN",
          403
        );
      }
    }

    return db
      .select({
        id: participations.id,
        userId: participations.userId,
        activityId: participations.activityId,
        status: participations.status,
        createdAt: participations.createdAt,
        userPseudo: users.pseudo,
        userAvatar: users.avatar,
      })
      .from(participations)
      .innerJoin(users, eq(users.id, participations.userId))
      .where(
        isCreator
          ? eq(participations.activityId, activityId)
          : and(
              eq(participations.activityId, activityId),
              eq(participations.status, "ACCEPTED")
            )
      )
      .orderBy(desc(participations.createdAt));
  }
}
