import "dotenv/config";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { notifications } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE NOTIFICATIONS
 *
 * Gère la création et la consultation des notifications d'un utilisateur
 * (participation acceptée, nouveau message, etc.).
 */

export type Notification = typeof notifications.$inferSelect;

// Types de notifications émis par l'application (colonne `type` = varchar libre en base)
export type NotificationType = "PARTICIPATION_ACCEPTED" | "NEW_MESSAGE";

export interface CreateNotificationInput {
  usersId: string;
  type: NotificationType;
  contenu: string;
  activityId?: string;
}

// Une notification est considérée non lue si `estLu` est false ou absent (legacy).
const unreadCondition = or(isNull(notifications.estLu), eq(notifications.estLu, false));

export class NotificationService {
  static async create(input: CreateNotificationInput): Promise<void> {
    await db.insert(notifications).values({
      usersId: input.usersId,
      type: input.type,
      contenu: input.contenu,
      activityId: input.activityId ?? null,
      estLu: false,
    });
  }

  static async listMine(userId: string, limit = 30): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.usersId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const rows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.usersId, userId), unreadCondition));

    return rows.length;
  }

  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ estLu: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.usersId, userId)));
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ estLu: true })
      .where(and(eq(notifications.usersId, userId), unreadCondition));
  }
}
