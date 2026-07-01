import "dotenv/config";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  conversations,
  messages,
  participations,
} from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE CONVERSATION
 *
 * Gère les conversations de groupe liées aux activités et leurs messages.
 * Une conversation est créée automatiquement à la première consultation.
 */

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export class ConversationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ConversationError";
  }
}

async function assertUserCanAccessConversation(
  userId: string,
  activityId: string
): Promise<void> {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);

  if (!activity) {
    throw new ConversationError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
  }

  if (activity.creatorId === userId) return;

  const [participation] = await db
    .select()
    .from(participations)
    .where(
      and(
        eq(participations.activityId, activityId),
        eq(participations.userId, userId),
        eq(participations.status, "ACCEPTED")
      )
    )
    .limit(1);

  if (!participation) {
    throw new ConversationError(
      "Accès refusé : vous n'êtes pas participant de cette activité",
      "FORBIDDEN",
      403
    );
  }
}

export class ConversationService {
  /**
   * Récupère la conversation d'une activité, la crée si elle n'existe pas encore.
   * Réservé au créateur de l'activité et aux participants acceptés.
   */
  static async getOrCreateConversation(
    activityId: string,
    userId: string
  ): Promise<Conversation> {
    await assertUserCanAccessConversation(userId, activityId);

    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.activityId, activityId))
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(conversations)
      .values({ activityId })
      .returning();

    if (!created) {
      throw new ConversationError(
        "Erreur lors de la création de la conversation",
        "CONVERSATION_CREATION_FAILED",
        500
      );
    }

    return created;
  }

  /**
   * Récupère les messages d'une conversation (du plus récent au plus ancien).
   * Réservé au créateur de l'activité et aux participants acceptés.
   */
  static async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<Message[]> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new ConversationError(
        "Conversation non trouvée",
        "CONVERSATION_NOT_FOUND",
        404
      );
    }

    await assertUserCanAccessConversation(userId, conversation.activityId);

    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationsId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
