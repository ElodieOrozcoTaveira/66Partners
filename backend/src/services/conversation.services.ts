import "dotenv/config";
import { eq, and, desc, inArray, isNull } from "drizzle-orm";
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
import { isUniqueViolation } from "../utils/db-errors.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE CONVERSATION
 *
 * Gère les conversations liées aux activités et leurs messages : la
 * conversation de groupe (participantId NULL, créée à la première
 * acceptation d'une demande — cf. ParticipationService.acceptParticipation)
 * et les fils privés "covoiturage" (participantId renseigné, un par couple
 * activité+participant — cf. getOrCreateCarpoolConversation).
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

/**
 * `participantId` : celui de la CONVERSATION visée (`null` = fil de groupe,
 * sinon fil privé covoiturage réservé à ce participant précis). Ne pas
 * confondre avec `userId`, l'utilisateur qui demande l'accès.
 */
async function assertUserCanAccessConversation(
  userId: string,
  activityId: string,
  participantId: string | null
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

  // Fil privé covoiturage : réservé au créateur (déjà traité ci-dessus) et à
  // ce participant précis — jamais aux autres participants de l'activité.
  if (participantId && participantId !== userId) {
    throw new ConversationError(
      "Accès refusé : cette conversation ne vous concerne pas",
      "FORBIDDEN",
      403
    );
  }

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
    await assertUserCanAccessConversation(userId, activityId, null);

    // participantId IS NULL : cible bien le fil de groupe, jamais un fil
    // privé covoiturage de la même activité (cf. index uniques partiels).
    const [existing] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.activityId, activityId), isNull(conversations.participantId)))
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
   * Résout (et crée si besoin) le fil privé "covoiturage" entre le créateur
   * de l'activité et `participantUserId`. Réservé au participant concerné
   * lui-même (le créateur n'initie jamais ce fil, cf. getCarpoolConversation
   * pour sa consultation). Vérifie le covoiturage activé et le statut
   * accepté avant toute création ; idempotent — réutilise le fil existant,
   * jamais de doublon (garanti par l'index unique partiel sur
   * conversations(activity_id, participant_id)).
   */
  static async getOrCreateCarpoolConversation(
    activityId: string,
    participantUserId: string,
    requesterId: string
  ): Promise<Conversation> {
    if (requesterId !== participantUserId) {
      throw new ConversationError(
        "Cette conversation ne peut être activée que par le participant concerné",
        "FORBIDDEN",
        403
      );
    }

    const findExisting = () =>
      db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.activityId, activityId),
            eq(conversations.participantId, participantUserId)
          )
        )
        .limit(1)
        .then((rows) => rows[0]);

    const existing = await findExisting();
    if (existing) return existing;

    const activity = await ActivityService.getActivityById(activityId);
    if (!activity) {
      throw new ConversationError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
    }
    if (!activity.carpoolEnabled) {
      throw new ConversationError(
        "Le covoiturage n'est pas proposé pour cette activité",
        "CARPOOL_NOT_ENABLED",
        403
      );
    }

    const [participation] = await db
      .select()
      .from(participations)
      .where(
        and(
          eq(participations.activityId, activityId),
          eq(participations.userId, participantUserId),
          eq(participations.status, "ACCEPTED")
        )
      )
      .limit(1);

    if (!participation) {
      throw new ConversationError(
        "Seul un participant accepté peut activer le covoiturage",
        "NOT_ACCEPTED_PARTICIPANT",
        403
      );
    }

    let created: Conversation | undefined;
    try {
      [created] = await db
        .insert(conversations)
        .values({ activityId, participantId: participantUserId })
        .returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        const race = await findExisting();
        if (race) return race;
      }
      throw error;
    }

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
   * Récupère (sans jamais créer) le fil privé covoiturage entre le créateur
   * et `participantUserId`. Réservé au créateur de l'activité ou à ce
   * participant précis — le créateur ne peut jamais démarrer ce fil
   * lui-même, seulement le consulter une fois que le participant l'a activé.
   */
  static async getCarpoolConversation(
    activityId: string,
    participantUserId: string,
    requesterId: string
  ): Promise<Conversation> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity) {
      throw new ConversationError("Activité non trouvée", "ACTIVITY_NOT_FOUND", 404);
    }

    if (requesterId !== activity.creatorId && requesterId !== participantUserId) {
      throw new ConversationError(
        "Accès refusé : cette conversation ne vous concerne pas",
        "FORBIDDEN",
        403
      );
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.activityId, activityId),
          eq(conversations.participantId, participantUserId)
        )
      )
      .limit(1);

    if (!conversation) {
      throw new ConversationError(
        "Conversation non trouvée",
        "CONVERSATION_NOT_FOUND",
        404
      );
    }

    return conversation;
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

    await assertUserCanAccessConversation(userId, conversation.activityId, conversation.participantId);

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
    const createdIds = new Set(
      myActivities.filter((activity) => activity.creatorId === userId).map((activity) => activity.id)
    );

    const mine = myActivities.filter(
      (activity) => createdIds.has(activity.id) || joinedIds.has(activity.id)
    );

    if (mine.length === 0) return [];

    const activityIds = mine.map((activity) => activity.id);
    const activityById = new Map(mine.map((activity) => [activity.id, activity]));

    const allConversations = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.activityId, activityIds));

    // Un fil de groupe est visible dès qu'on est créateur/participant accepté
    // de l'activité (déjà garanti par `mine`) ; un fil privé covoiturage
    // n'est visible que par les deux personnes concernées (le participant,
    // ou le créateur de l'activité).
    const visibleConversations = allConversations.filter(
      (conversation) =>
        conversation.participantId === null ||
        conversation.participantId === userId ||
        createdIds.has(conversation.activityId)
    );

    const conversationIds = visibleConversations.map((conversation) => conversation.id);
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

    const groupConversationByActivity = new Map(
      visibleConversations
        .filter((conversation) => conversation.participantId === null)
        .map((conversation) => [conversation.activityId, conversation])
    );
    const carpoolConversations = visibleConversations.filter(
      (conversation) => conversation.participantId !== null
    );

    // Pseudo/avatar publics de l'autre partie de chaque fil covoiturage —
    // jamais l'email ni une autre donnée privée (cf. toPublicProfile).
    const carpoolParticipantIds = Array.from(
      new Set(carpoolConversations.map((conversation) => conversation.participantId as string))
    );
    const carpoolUsers =
      carpoolParticipantIds.length > 0
        ? await db
            .select({ id: users.id, pseudo: users.pseudo, avatar: users.avatar })
            .from(users)
            .where(inArray(users.id, carpoolParticipantIds))
        : [];
    const carpoolUserById = new Map(carpoolUsers.map((user) => [user.id, user]));

    const groupSummaries: ConversationSummary[] = mine.map((activity) => {
      const conversation = groupConversationByActivity.get(activity.id) ?? null;
      const lastMessage = conversation
        ? lastMessageByConversation.get(conversation.id) ?? null
        : null;

      return {
        conversationId: conversation?.id ?? null,
        activityId: activity.id,
        activityTitle: activity.title,
        sportName: activity.sportName,
        participantsCount: activity.participantsCount,
        isCarpool: false,
        carpoolWithUserId: null,
        carpoolWithPseudo: null,
        carpoolWithAvatar: null,
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

    const carpoolSummaries: ConversationSummary[] = carpoolConversations.map((conversation) => {
      const activity = activityById.get(conversation.activityId)!;
      const lastMessage = lastMessageByConversation.get(conversation.id) ?? null;
      const carpoolWith = carpoolUserById.get(conversation.participantId as string);

      return {
        conversationId: conversation.id,
        activityId: activity.id,
        activityTitle: activity.title,
        sportName: activity.sportName,
        participantsCount: activity.participantsCount,
        isCarpool: true,
        carpoolWithUserId: conversation.participantId as string,
        carpoolWithPseudo: carpoolWith?.pseudo ?? null,
        carpoolWithAvatar: carpoolWith?.avatar ?? null,
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

    const summaries = [...groupSummaries, ...carpoolSummaries];

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

    await assertUserCanAccessConversation(userId, conversation.activityId, conversation.participantId);

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

    // Un fil privé covoiturage ne notifie que l'autre partie du duo (pas
    // tous les participants de l'activité, contrairement au fil de groupe).
    const notifyPromise = conversation.participantId
      ? ConversationService.notifyNewCarpoolMessage(
          conversation.activityId,
          conversation.participantId,
          userId,
        )
      : ConversationService.notifyNewMessage(conversation.activityId, userId);

    notifyPromise.catch((err) =>
      console.error("Erreur création notification (nouveau message):", err),
    );

    return created;
  }

  /**
   * Notifie l'autre partie d'un fil privé covoiturage (le créateur si
   * l'expéditeur est le participant, ou inversement) qu'un nouveau message a
   * été envoyé.
   */
  private static async notifyNewCarpoolMessage(
    activityId: string,
    participantId: string,
    senderId: string,
  ): Promise<void> {
    const [activity] = await db
      .select({ title: activities.title, creatorId: activities.creatorId })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity) return;

    const recipientId = senderId === activity.creatorId ? participantId : activity.creatorId;
    // Le créateur peut avoir supprimé son compte (creatorId -> null) : plus
    // personne à notifier côté "créateur", le fil reste néanmoins utilisable.
    if (!recipientId || recipientId === senderId) return;

    const [sender] = await db
      .select({ pseudo: users.pseudo })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    await NotificationService.create({
      usersId: recipientId,
      type: "NEW_MESSAGE",
      contenu: `${sender?.pseudo ?? "Quelqu'un"} a envoyé un message (covoiturage) pour "${activity.title}"`,
      activityId,
      carpoolParticipantId: participantId,
    });
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

    // Le créateur peut avoir supprimé son compte (creatorId -> null) : il
    // est simplement exclu des destinataires, les autres participants
    // continuent de recevoir la notification normalement.
    const recipientIds = new Set<string>(
      [activity.creatorId, ...acceptedParticipants.map((row) => row.userId)].filter(
        (id): id is string => id !== null,
      ),
    );
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
  /** true = fil privé covoiturage ; false = conversation de groupe de l'activité. */
  isCarpool: boolean;
  /** Identité publique de l'autre partie d'un fil covoiturage (jamais pour un fil de groupe). */
  carpoolWithUserId: string | null;
  carpoolWithPseudo: string | null;
  carpoolWithAvatar: string | null;
  lastMessage: { contenu: string | null; createdAt: Date; authorId: string } | null;
  activityStartDate: Date;
}
