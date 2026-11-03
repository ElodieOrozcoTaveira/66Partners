import { NavLink } from "react-router-dom";
import { CalendarDays, MapPin, Navigation } from "lucide-react";
import { useBranding } from "../../contexts/TerritoryContext";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import { getSportPhoto } from "../../lib/sportPhotos";
import { formatRelativeDay, formatWhen } from "../../lib/dateFormat";
import { distanceKm, formatDistance, type Coordinates } from "../../lib/geo";
import { LEVEL_LABELS, type ActivityLevel } from "../../lib/activityLabels";
import { AUDIENCE_LABELS, type ActivityAudience } from "../../lib/audience";
import "./ActivityCard.scss";

export interface ActivityCardData {
  id: string;
  title: string;
  city: string;
  startDate: string;
  maxParticipants: number;
  participantsCount: number;
  status?: string;
  sportName: string;
  creatorPseudo: string | null;
  creatorAvatar: string | null;
  levelRequired?: ActivityLevel;
  audience?: ActivityAudience;
  latitude?: number | null;
  longitude?: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

interface ActivityCardProps {
  activity: ActivityCardData;
  /** Lien de la carte (par défaut, le détail de l'activité). */
  to?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Position de l'utilisateur, pour afficher « 4 km ». */
  from?: Coordinates | null;
  /** Vignette compacte (carrousels). */
  compact?: boolean;
}

/**
 * Carte d'activité de la refonte (même contenu que l'app mobile) : grande
 * photo, sport, quand, où, distance, organisateur, places restantes et jauge.
 */
export default function ActivityCard({ activity, to, onClick, from, compact = false }: ActivityCardProps) {
  const { asset } = useBranding();
  const start = new Date(activity.startDate);
  const { icon: Icon, color } = getSportVisual(activity.sportName);
  const placesLeft = Math.max(0, activity.maxParticipants - activity.participantsCount);
  const isFull = placesLeft === 0;
  const isCancelled = activity.status === "CANCELLED";
  const fill = Math.min(1, activity.participantsCount / Math.max(1, activity.maxParticipants));
  const relativeDay = formatRelativeDay(start);
  const badge = relativeDay === "Aujourd'hui" || relativeDay === "Demain" ? relativeDay : null;
  const distance =
    from && activity.latitude != null && activity.longitude != null
      ? distanceKm(from, { latitude: activity.latitude, longitude: activity.longitude })
      : null;
  const statusLabel = activity.status ? STATUS_LABELS[activity.status] : undefined;

  return (
    <NavLink
      to={to ?? `/activities/${activity.id}`}
      onClick={onClick}
      className={`ac-card${compact ? " ac-card--compact" : ""}${isCancelled ? " ac-card--cancelled" : ""}`}
    >
      <div className="ac-card__photo">
        <img src={getSportPhoto(activity.sportName)} alt="" loading="lazy" />
        <div className="ac-card__shade" />

        <div className="ac-card__top">
          {badge ? <span className="ac-card__badge">{badge}</span> : <span />}
          {statusLabel ? (
            <span className={`ac-card__pill ac-card__pill--${activity.status?.toLowerCase()}`}>{statusLabel}</span>
          ) : distance !== null ? (
            <span className="ac-card__pill">
              <Navigation size={11} />
              {formatDistance(distance)}
            </span>
          ) : null}
        </div>

        <div className="ac-card__bottom">
          <span className="ac-card__sport" style={{ backgroundColor: color }}>
            <Icon size={15} color={getIconColor(color)} />
          </span>
          <span className="ac-card__sport-name">{activity.sportName}</span>
          {activity.audience && activity.audience !== "ALL" ? (
            <span className="ac-card__audience">{AUDIENCE_LABELS[activity.audience]}</span>
          ) : null}
        </div>
      </div>

      <div className="ac-card__body">
        <h3 className="ac-card__title">{activity.title}</h3>
        <p className="ac-card__meta">
          <CalendarDays size={15} />
          {formatWhen(start)}
        </p>
        <p className="ac-card__meta">
          <MapPin size={15} />
          {activity.city}
          {activity.levelRequired && !compact ? (
            <span className="ac-card__level">{LEVEL_LABELS[activity.levelRequired]}</span>
          ) : null}
        </p>

        <div className="ac-card__footer">
          <span className="ac-card__organizer">
            <img src={activity.creatorAvatar || asset("avatarDefault")} alt="" />
            <span>{activity.creatorPseudo ? `Par ${activity.creatorPseudo}` : "Compte supprimé"}</span>
          </span>
          <span className={`ac-card__places${isFull ? " ac-card__places--full" : ""}`}>
            {isFull ? "Complet" : `${placesLeft} place${placesLeft > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="ac-card__gauge" aria-hidden="true">
          <span style={{ width: `${Math.max(fill, 0.04) * 100}%` }} className={isFull ? "is-full" : undefined} />
        </div>
      </div>
    </NavLink>
  );
}
