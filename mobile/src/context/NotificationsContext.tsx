import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { useAuth } from "./AuthContext";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "../services/notifications.service";

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  /** true tant que le premier chargement n'a pas abouti. */
  isLoading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// Même rythme que le site (frontend/src/contexts/NotificationsContext.tsx).
const POLL_INTERVAL_MS = 20000;

interface NotificationsState {
  /** Utilisateur à qui appartiennent ces données (évite d'afficher celles d'un autre compte). */
  userId: string;
  notifications: AppNotification[];
  unreadCount: number;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<NotificationsState | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getNotifications();
      setState({ userId, notifications: data.notifications, unreadCount: data.unreadCount });
    } catch {
      // Silencieux : la cloche garde son dernier état, nouvel essai au prochain cycle.
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const poll = () => {
      getNotifications()
        .then((data) => {
          if (!cancelled) {
            setState({ userId, notifications: data.notifications, unreadCount: data.unreadCount });
          }
        })
        .catch(() => undefined); // nouvel essai au prochain cycle
    };

    poll();
    // Interrogation seulement quand l'app est au premier plan.
    let interval: ReturnType<typeof setInterval> | null = setInterval(poll, POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") {
        poll();
        if (!interval) interval = setInterval(poll, POLL_INTERVAL_MS);
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, [userId]);

  // Données du compte connecté uniquement (vide après déconnexion).
  const current = state && state.userId === userId ? state : null;

  // Mises à jour optimistes ; en cas d'échec, on resynchronise avec le serveur.
  const markAsRead = useCallback(
    (id: string) => {
      setState((prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === id ? { ...n, estLu: true } : n
              ),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : prev
      );
      markNotificationAsRead(id).catch(() => void refresh());
    },
    [refresh]
  );

  const markAllAsRead = useCallback(() => {
    setState((prev) =>
      prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) => ({ ...n, estLu: true })),
            unreadCount: 0,
          }
        : prev
    );
    markAllNotificationsAsRead().catch(() => void refresh());
  }, [refresh]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: current?.notifications ?? [],
      unreadCount: current?.unreadCount ?? 0,
      isLoading: current === null,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [current, refresh, markAsRead, markAllAsRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications doit être utilisé dans un NotificationsProvider");
  }
  return context;
}
