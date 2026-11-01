import { api } from "./api";

/** Types émis par le backend (colonne `type`, cf. NotificationService). */
export type NotificationType =
  | "PARTICIPATION_ACCEPTED"
  | "PARTICIPATION_REQUESTED"
  | "NEW_MESSAGE"
  | "CARPOOL_REQUESTED";

export interface AppNotification {
  id: string;
  // string : un type ajouté plus tard côté serveur ne doit pas casser l'app.
  type: NotificationType | (string & {});
  contenu: string | null;
  estLu: boolean | null;
  activityId: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount: number;
}

/** 30 dernières notifications (plus récentes d'abord) + nombre de non lues. */
export async function getNotifications(): Promise<NotificationsResponse> {
  const response = await api.get<NotificationsResponse>("/notifications");
  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
