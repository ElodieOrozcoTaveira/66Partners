import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { NavLink, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Check, MapPin, Plus, Trash2, Users, X } from "lucide-react";
import api from "../../lib/axios";
import { useAuth } from "../../contexts/AuthContext";
import { ACTIVITY_NOTIFICATION_TYPES, useNotifications } from "../../contexts/NotificationsContext";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import { getSportPhoto } from "../../lib/sportPhotos";
import { LEVEL_LABELS, type ActivityLevel } from "../../lib/activityLabels";
import { formatMonth, formatTime, formatWeekday } from "../../lib/dateFormat";
import "./DetailActivite.scss";

type ActivityStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

interface ActivityDetail {
  id: string;
  title: string;
  description: string | null;
  city: string;
  startDate: string;
  levelRequired: ActivityLevel;
  maxParticipants: number;
  participantsCount: number;
  status: ActivityStatus;
  sportId: string;
  sportName: string;
  creatorId: string;
}

interface Photo {
  id: string;
  activityId: string;
  uploaderId: string;
  url: string;
  createdAt: string;
  authorPseudo: string;
  authorAvatar: string | null;
}

type ParticipationStatus = "PENDING" | "ACCEPTED" | "REFUSED";

interface MyParticipation {
  id: string;
  status: ParticipationStatus;
}

interface ParticipationRequest {
  id: string;
  userId: string;
  status: ParticipationStatus;
  userPseudo: string;
  userAvatar: string | null;
}

export default function DetailActivite() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notifications, markManyAsRead } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [canSeePhotos, setCanSeePhotos] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [myParticipation, setMyParticipation] = useState<MyParticipation | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    api
      .get<{ activity: ActivityDetail }>(`/api/activities/${id}`)
      .then((res) => {
        if (mounted) setActivity(res.data.activity);
      })
      .catch(() => {
        if (mounted) setNotFound(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Visiter cette activité vaut acquittement de ses notifications "activité"
  // (demande de participation reçue / acceptée) : son badge dans la liste
  // Mes activités se vide, sans toucher aux notifications des autres.
  useEffect(() => {
    if (!id) return;
    const unreadActivityIds = notifications
      .filter(
        (notif) => ACTIVITY_NOTIFICATION_TYPES.has(notif.type) && notif.activityId === id && !notif.estLu,
      )
      .map((notif) => notif.id);
    if (unreadActivityIds.length > 0) markManyAsRead(unreadActivityIds);
  }, [id, notifications, markManyAsRead]);

  const loadPhotos = useCallback(() => {
    if (!id) return;
    setPhotosLoading(true);

    api
      .get<{ photos: Photo[] }>(`/api/activities/${id}/photos`)
      .then((res) => {
        setPhotos(res.data.photos);
        setCanSeePhotos(true);
      })
      .catch(() => {
        setCanSeePhotos(false);
      })
      .finally(() => {
        setPhotosLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const isCreator = Boolean(activity && user && activity.creatorId === user.id);

  useEffect(() => {
    if (!activity || !id || !user) return;

    if (activity.creatorId === user.id) {
      api
        .get<{ participations: ParticipationRequest[] }>(
          `/api/activities/${id}/participations`,
        )
        .then((res) => setRequests(res.data.participations))
        .catch(() => setRequests([]));
    } else {
      api
        .get<{ participation: MyParticipation | null }>(
          `/api/activities/${id}/my-participation`,
        )
        .then((res) => setMyParticipation(res.data.participation))
        .catch(() => setMyParticipation(null));
    }
  }, [activity, id, user]);

  async function handleJoin() {
    if (!id) return;
    setIsJoining(true);
    try {
      const res = await api.post<{ participation: MyParticipation }>(
        `/api/activities/${id}/join`,
      );
      setMyParticipation(res.data.participation);
    } catch (err) {
      console.error("DetailActivite: failed to join activity", err);
      window.alert("Impossible d'envoyer la demande de participation.");
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCancelParticipation() {
    if (!myParticipation) return;
    const previous = myParticipation;
    setMyParticipation(null);
    try {
      await api.delete(`/api/participations/${previous.id}`);
    } catch (err) {
      console.error("DetailActivite: failed to cancel participation", err);
      setMyParticipation(previous);
    }
  }

  async function handleAcceptRequest(participationId: string) {
    try {
      await api.put(`/api/participations/${participationId}/accept`);
      setRequests((prev) =>
        prev.map((request) =>
          request.id === participationId
            ? { ...request, status: "ACCEPTED" }
            : request,
        ),
      );
      setActivity((prev) =>
        prev ? { ...prev, participantsCount: prev.participantsCount + 1 } : prev,
      );
    } catch (err) {
      console.error("DetailActivite: failed to accept request", err);
      window.alert("Impossible d'accepter cette demande.");
    }
  }

  async function handleRefuseRequest(participationId: string) {
    try {
      await api.put(`/api/participations/${participationId}/refuse`);
      setRequests((prev) =>
        prev.map((request) =>
          request.id === participationId
            ? { ...request, status: "REFUSED" }
            : request,
        ),
      );
    } catch (err) {
      console.error("DetailActivite: failed to refuse request", err);
      window.alert("Impossible de refuser cette demande.");
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !id) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      await api.post(`/api/activities/${id}/photos`, formData, {
        headers: { "Content-Type": undefined },
      });
      loadPhotos();
    } catch (err) {
      console.error("DetailActivite: failed to upload photo", err);
      window.alert("La photo n'a pas pu être envoyée.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(photoId: string) {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    try {
      await api.delete(`/api/activity-photos/${photoId}`);
    } catch (err) {
      console.error("DetailActivite: failed to delete photo", err);
      loadPhotos();
    }
  }

  if (isLoading) {
    return (
      <div className="detailactivite-page">
        <p className="detailactivite-page__state">Chargement...</p>
      </div>
    );
  }

  if (notFound || !activity) {
    return (
      <div className="detailactivite-page">
        <p className="detailactivite-page__state">Activité introuvable.</p>
      </div>
    );
  }

  const { icon: Icon, color } = getSportVisual(activity.sportName);
  const startDate = new Date(activity.startDate);
  const hasEnded = startDate.getTime() < Date.now();

  return (
    <div className="detailactivite-page">
      <div className="detailactivite-page__cover">
        <img src={getSportPhoto(activity.sportName)} alt={activity.sportName} />
        <div className="detailactivite-page__cover-overlay" />
        <NavLink to="/explorer" className="detailactivite-page__back" aria-label="Retour">
          <ArrowLeft size={18} strokeWidth={2.2} />
        </NavLink>
        <span
          className="detailactivite-page__sport-badge"
          style={{ backgroundColor: color, color: getIconColor(color) }}
        >
          <Icon size={16} />
          {activity.sportName}
        </span>
      </div>

      <div className="detailactivite-page__body">
        <h1 className="detailactivite-page__title">{activity.title}</h1>

        <div className="detailactivite-page__meta">
          <span>
            <Calendar size={15} />
            {formatWeekday(startDate)} {startDate.getDate()} {formatMonth(startDate)} ·{" "}
            {formatTime(startDate)}
          </span>
          <span>
            <MapPin size={15} />
            {activity.city}
          </span>
          <span>
            <Users size={15} />
            {activity.participantsCount}/{activity.maxParticipants} participants
          </span>
        </div>

        <span className="detailactivite-page__level">
          {LEVEL_LABELS[activity.levelRequired]}
        </span>

        {isCreator ? (
          <section className="detailactivite-page__requests">
            <h2>Demandes de participation</h2>
            {requests.filter((r) => r.status !== "REFUSED").length === 0 ? (
              <p className="detailactivite-page__requests-empty">
                Aucune demande pour l'instant.
              </p>
            ) : (
              <div className="detailactivite-page__requests-list">
                {requests
                  .filter((request) => request.status !== "REFUSED")
                  .map((request) => (
                    <div key={request.id} className="request-row">
                      <NavLink
                        to={`/profile/${request.userId}`}
                        className="request-row__identity"
                      >
                        <img
                          src={request.userAvatar || "/avatardefault.webp"}
                          alt={request.userPseudo}
                          className="request-row__avatar"
                        />
                        <span className="request-row__name">{request.userPseudo}</span>
                      </NavLink>
                      {request.status === "PENDING" ? (
                        <div className="request-row__actions">
                          <button
                            type="button"
                            className="request-row__accept"
                            onClick={() => handleAcceptRequest(request.id)}
                            aria-label="Accepter"
                          >
                            <Check size={14} strokeWidth={2.6} />
                          </button>
                          <button
                            type="button"
                            className="request-row__refuse"
                            onClick={() => handleRefuseRequest(request.id)}
                            aria-label="Refuser"
                          >
                            <X size={14} strokeWidth={2.6} />
                          </button>
                        </div>
                      ) : (
                        <span className="request-row__status">Inscrit·e</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>
        ) : (
          <div className="detailactivite-page__join">
            {!myParticipation ? (
              hasEnded ? (
                <button type="button" className="join-button" disabled>
                  Activité déjà passée
                </button>
              ) : activity.participantsCount >= activity.maxParticipants ? (
                <button type="button" className="join-button" disabled>
                  Complet
                </button>
              ) : (
                <button
                  type="button"
                  className="join-button"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? "Envoi..." : "Rejoindre l'activité"}
                </button>
              )
            ) : myParticipation.status === "PENDING" ? (
              <>
                <span className="join-badge join-badge--pending">Demande envoyée</span>
                <button
                  type="button"
                  className="join-button join-button--outline"
                  onClick={handleCancelParticipation}
                >
                  Annuler ma demande
                </button>
              </>
            ) : myParticipation.status === "ACCEPTED" ? (
              <>
                <span className="join-badge join-badge--accepted">Tu participes ✓</span>
                <button
                  type="button"
                  className="join-button join-button--outline"
                  onClick={handleCancelParticipation}
                >
                  Se désinscrire
                </button>
              </>
            ) : (
              <span className="join-badge join-badge--refused">Demande refusée</span>
            )}
          </div>
        )}

        {activity.description && (
          <p className="detailactivite-page__description">{activity.description}</p>
        )}

        {canSeePhotos && (
          <section className="detailactivite-page__photos">
            <div className="detailactivite-page__photos-header">
              <h2>Photos</h2>
              {hasEnded && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Plus size={14} strokeWidth={2.4} />
                  Ajouter
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleUpload}
              />
            </div>

            {!hasEnded ? (
              <p className="detailactivite-page__photos-empty">
                Les photos seront disponibles après l'activité.
              </p>
            ) : photosLoading ? (
              <p className="detailactivite-page__photos-empty">Chargement...</p>
            ) : photos.length === 0 ? (
              <p className="detailactivite-page__photos-empty">
                Aucune photo pour l'instant. Sois le premier à en ajouter !
              </p>
            ) : (
              <div className="detailactivite-page__photos-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="detailactivite-photo">
                    <img src={photo.url} alt={`Photo ajoutée par ${photo.authorPseudo}`} />
                    {photo.uploaderId === user?.id && (
                      <button
                        type="button"
                        className="detailactivite-photo__remove"
                        onClick={() => handleDelete(photo.id)}
                        aria-label="Supprimer la photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
