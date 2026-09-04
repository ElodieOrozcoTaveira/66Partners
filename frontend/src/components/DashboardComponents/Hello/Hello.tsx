import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Camera, CheckCheck, MessageCircle, UserCheck2, UserPlus } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications, type AppNotification } from "../../../contexts/NotificationsContext";
import api from "../../../lib/axios";
import { formatRelativeTime } from "../../../lib/dateFormat";
import ImageCropModal from "../../ProfilPage/ImageCropModal/ImageCropModal";
import "./Hello.scss";

interface HelloProps {
  pseudo: string;
  avatar: string | null;
  coverPhoto: string | null;
}

function notificationIcon(type: AppNotification["type"]) {
  if (type === "PARTICIPATION_ACCEPTED") return UserCheck2;
  if (type === "PARTICIPATION_REQUESTED") return UserPlus;
  if (type === "NEW_MESSAGE") return MessageCircle;
  return Bell;
}

export default function Hello({ pseudo, avatar, coverPhoto }: HelloProps) {
  const { refreshUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<string | null>(null);

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

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPendingCrop(URL.createObjectURL(file));
  }

  function closeCropModal() {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop);
    setPendingCrop(null);
  }

  async function handleCropValidate(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, "avatar.jpg");

    setIsUploading(true);
    try {
      await api.post("/api/users/me/avatar", formData, {
        headers: { "Content-Type": undefined },
      });
      await refreshUser();
      closeCropModal();
    } catch (error) {
      console.error("Impossible d'envoyer la photo", error);
      window.alert("La photo n'a pas pu être envoyée.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="container-hello">
      <div
        className="container-hello__cover"
        style={{ backgroundImage: `url(${coverPhoto || "/couverture.webp"})` }}
      >
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

      <div className="container-hello__row">
        <div className="container-hello__avatar-wrap">
          <img
            src={avatar || "/avatardefault.webp"}
            alt={`Photo de profil de ${pseudo}`}
            className="container-hello__avatar"
          />
          <button
            type="button"
            className="container-hello__avatarEdit"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploading}
            aria-label="Modifier la photo de profil"
          >
            <Camera size={13} strokeWidth={2.2} />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </div>

        <div className="container-hello__text">
          <h1 className="container-hello__h1">Bonjour {pseudo} ! 👋</h1>
          <p className="container-hello__p">Prêt pour de nouvelles aventures ?</p>
        </div>
      </div>

      {pendingCrop && (
        <ImageCropModal
          imageSrc={pendingCrop}
          aspect={1}
          cropShape="round"
          outputSize={{ width: 400, height: 400 }}
          title="Recadrer la photo de profil"
          isSaving={isUploading}
          onCancel={closeCropModal}
          onValidate={handleCropValidate}
        />
      )}
    </div>
  );
}
