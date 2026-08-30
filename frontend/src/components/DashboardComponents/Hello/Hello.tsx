import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, MessageCircle, UserCheck2 } from "lucide-react";
import { useNotifications, type AppNotification } from "../../../contexts/NotificationsContext";
import { formatRelativeTime } from "../../../lib/dateFormat";
import Hamburger from "../../BurgerComponent/Hamburger/Hamburger";
import "./Hello.scss";

interface HelloProps {
  pseudo: string;
  avatar: string | null;
  coverPhoto: string | null;
}

function notificationIcon(type: AppNotification["type"]) {
  if (type === "PARTICIPATION_ACCEPTED") return UserCheck2;
  if (type === "NEW_MESSAGE") return MessageCircle;
  return Bell;
}

export default function Hello({ pseudo, avatar, coverPhoto }: HelloProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleNotificationClick(notification: AppNotification) {
    if (!notification.estLu) markAsRead(notification.id);
    setIsOpen(false);

    if (notification.activityId) {
      if (notification.type === "NEW_MESSAGE") {
        navigate(`/messages/${notification.activityId}`);
      } else {
        navigate(`/activities/${notification.activityId}`);
      }
    }
  }

  return (
    <div className="container-hello">
      <div
        className="container-hello__cover"
        style={{ backgroundImage: `url(${coverPhoto || "/couverture.png"})` }}
      >
        <div className="container-hello__menu">
          <Hamburger />
        </div>

        <img
          src={avatar || "/montagne.webp"}
          alt={`Photo de profil de ${pseudo}`}
          className="container-hello__avatar"
        />
      </div>
      <div className="container-hello__text">
        <h1 className="container-hello__h1">Bonjour {pseudo} !</h1>
        <p className="container-hello__p">Prêt pour de nouvelles aventures ?</p>
      </div>

      <div className="container-hello__bell-wrap" ref={panelRef}>
        <button
          type="button"
          className={`container-hello__bell${unreadCount > 0 ? " container-hello__bell--unread" : ""}`}
          aria-label={
            unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : "Notifications"
          }
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Bell size={19} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="container-hello__badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="notifications-panel">
            <div className="notifications-panel__header">
              <h2 className="notifications-panel__title">Notifications</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notifications-panel__markall"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck size={13} /> Tout marquer comme lu
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="notifications-panel__empty">
                Tu n'as pas encore de notification.
              </p>
            ) : (
              <ul className="notifications-panel__list">
                {notifications.map((notification) => {
                  const Icon = notificationIcon(notification.type);
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        className={`notification-item${!notification.estLu ? " notification-item--unread" : ""}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <span className="notification-item__icon">
                          <Icon size={15} />
                        </span>
                        <span className="notification-item__body">
                          <span className="notification-item__text">
                            {notification.contenu}
                          </span>
                          <span className="notification-item__time">
                            {formatRelativeTime(new Date(notification.createdAt))}
                          </span>
                        </span>
                        {!notification.estLu && (
                          <span className="notification-item__dot" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
