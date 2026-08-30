import "dotenv/config";
import { eq, and, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  conversations,
  messages,
  participations,
  users,
} from "../db/schema.js";
import { ActivityService } from "./activity.services.js";
import { NotificationService } from "./notification.services.js";

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
  ): Promise<MessageWithAuthor[]> {
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
      .select({
        id: messages.id,
        contenu: messages.contenu,
        createdAt: messages.createdAt,
        usersId: messages.usersId,
        conversationsId: messages.conversationsId,
        authorPseudo: users.pseudo,
        authorAvatar: users.avatar,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.usersId))
      .where(eq(messages.conversationsId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Liste les discussions de l'utilisateur : une ligne par activité qu'il a
   * créée ou rejointe (participation acceptée), avec le dernier message le
   * cas échéant. Ne crée pas les conversations manquantes (lecture seule).
   */
  static async listMine(userId: string): Promise<ConversationSummary[]> {
    const myActivities = await ActivityService.listActivities();
    const joinedRows = await db
      .select({ activityId: participations.activityId })
      .from(participations)
      .where(
        and(eq(participations.userId, userId), eq(participations.status, "ACCEPTED"))
      );
    const joinedIds = new Set(joinedRows.map((row) => row.activityId));

    const mine = myActivities.filter(
      (activity) => activity.creatorId === userId || joinedIds.has(activity.id)
    );

    if (mine.length === 0) return [];

    const activityIds = mine.map((activity) => activity.id);
    const myConversations = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.activityId, activityIds));

    const conversationByActivity = new Map(
      myConversations.map((conversation) => [conversation.activityId, conversation])
    );

    const conversationIds = myConversations.map((conversation) => conversation.id);
    const lastMessageByConversation = new Map<string, Message>();

    if (conversationIds.length > 0) {
      const recentMessages = await db
        .select()
        .from(messages)
        .where(inArray(messages.conversationsId, conversationIds))
        .orderBy(desc(messages.createdAt));

      for (const message of recentMessages) {
        if (!lastMessageByConversation.has(message.conversationsId)) {
          lastMessageByConversation.set(message.conversationsId, message);
        }
      }
    }

    const summaries = mine.map((activity) => {
      const conversation = conversationByActivity.get(activity.id) ?? null;
      const lastMessage = conversation
        ? lastMessageByConversation.get(conversation.id) ?? null
        : null;

      return {
        activityId: activity.id,
        activityTitle: activity.title,
        sportName: activity.sportName,
        participantsCount: activity.participantsCount,
        conversationId: conversation?.id ?? null,
        lastMessage: lastMessage
          ? {
              contenu: lastMessage.contenu,
              createdAt: lastMessage.createdAt,
              authorId: lastMessage.usersId,
            }
          : null,
        activityStartDate: activity.startDate,
      };
    });

    summaries.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt ?? a.activityStartDate;
      const dateB = b.lastMessage?.createdAt ?? b.activityStartDate;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return summaries;
  }

  /**
   * Envoie un message dans une conversation. Réservé au créateur de
   * l'activité et aux participants acceptés.
   */
  static async sendMessage(
    conversationId: string,
    userId: string,
    contenu: string
  ): Promise<Message> {
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

    const [created] = await db
      .insert(messages)
      .values({ contenu, usersId: userId, conversationsId: conversationId })
      .returning();

    if (!created) {
      throw new ConversationError(
        "Erreur lors de l'envoi du message",
        "MESSAGE_CREATION_FAILED",
        500
      );
    }

    ConversationService.notifyNewMessage(conversation.activityId, userId).catch((err) =>
      console.error("Erreur création notification (nouveau message):", err),
    );

    return created;
  }

  /**
   * Notifie les autres participants de l'activité (créateur + participants
   * acceptés, hors expéditeur) qu'un nouveau message a été envoyé.
   */
  private static async notifyNewMessage(activityId: string, senderId: string): Promise<void> {
    const [activity] = await db
      .select({ title: activities.title, creatorId: activities.creatorId })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity) return;

    const [sender] = await db
      .select({ pseudo: users.pseudo })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    const acceptedParticipants = await db
      .select({ userId: participations.userId })
      .from(participations)
      .where(
        and(eq(participations.activityId, activityId), eq(participations.status, "ACCEPTED"))
      );

    const recipientIds = new Set<string>([
      activity.creatorId,
      ...acceptedParticipants.map((row) => row.userId),
    ]);
    recipientIds.delete(senderId);

    await Promise.all(
      Array.from(recipientIds).map((usersId) =>
        NotificationService.create({
          usersId,
          type: "NEW_MESSAGE",
          contenu: `${sender?.pseudo ?? "Quelqu'un"} a envoyé un message dans "${activity.title}"`,
          activityId,
        })
      )
    );
  }
}

export type MessageWithAuthor = Message & {
  authorPseudo: string;
  authorAvatar: string | null;
};

export interface ConversationSummary {
  activityId: string;
  activityTitle: string;
  sportName: string;
  participantsCount: number;
  conversationId: string | null;
  lastMessage: { contenu: string | null; createdAt: Date; authorId: string } | null;
  activityStartDate: Date;
}
