import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../lib/axios";
import { useAuth } from "./AuthContext";

export interface AppNotification {
  id: string;
  type: "PARTICIPATION_ACCEPTED" | "NEW_MESSAGE" | string;
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

type NotificationsContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessagesCount: number;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const POLL_INTERVAL_MS = 20000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<NotificationsResponse>("/api/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("NotificationsContext: failed to fetch notifications", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);

    function handleVisibility() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, refresh]);

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, estLu: true } : notif)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      console.error("NotificationsContext: failed to mark notification as read", err);
      refresh();
    }
  }

  async function markAllAsRead() {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, estLu: true })));
    setUnreadCount(0);
    try {
      await api.patch("/api/notifications/read-all");
    } catch (err) {
      console.error("NotificationsContext: failed to mark all notifications as read", err);
      refresh();
    }
  }

  const unreadMessagesCount = notifications.filter(
    (notif) => notif.type === "NEW_MESSAGE" && !notif.estLu,
  ).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, unreadMessagesCount, refresh, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
