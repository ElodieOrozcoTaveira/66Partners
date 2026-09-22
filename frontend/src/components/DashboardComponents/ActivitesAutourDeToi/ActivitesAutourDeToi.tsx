import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { CalendarX, MapPin, Users } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useBranding } from "../../../contexts/TerritoryContext";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
import { formatMonth, formatWeekday } from "../../../lib/dateFormat";
import "../../HomeComponents/ActivitésProche/ActivitésProche.scss";
import "./ActivitesAutourDeToi.scss";

const RECENT_COUNT = 4;

interface Activity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  sportName: string;
  participantsCount: number;
  createdAt: string;
  creatorId: string | null;
}

interface ActivitesAutourDeToiProps {
  /** Toutes les activités (déjà chargées par Dashboard.tsx). */
  activities: Activity[];
  /** Activités auxquelles l'utilisateur participe. */
  myActivities: Activity[];
  isLoading: boolean;
}

export default function ActivitesAutourDeToi({
  activities,
  myActivities,
  isLoading,
}: ActivitesAutourDeToiProps) {
  const { user } = useAuth();
  const { inseeDepartmentCode } = useBranding();

  const joinedIds = useMemo(
    () => new Set(myActivities.map((activity) => activity.id)),
    [myActivities],
  );

  const recent = useMemo(() => {
    const isMine = (activity: Activity) =>
      activity.creatorId === user?.id || joinedIds.has(activity.id);

    return [...activities]
      .filter((activity) => activity.status !== "CANCELLED")
      .sort((a, b) => {
        const mineDiff = Number(isMine(b)) - Number(isMine(a));
        if (mineDiff !== 0) return mineDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, RECENT_COUNT);
  }, [activities, joinedIds, user]);

  return (
    <div className="container-autourdetoi">
      <div className="container-autourdetoi__header">
        <h2 className="container-autourdetoi__h2">Activités autour de toi</h2>
        <NavLink to="/explorer" className="container-autourdetoi__link">
          Voir tout
        </NavLink>
      </div>

      {isLoading ? (
        <p className="container-autourdetoi__empty">Chargement...</p>
      ) : recent.length === 0 ? (
        <div className="container-activitesproche__empty">
          <span className="container-activitesproche__empty-icon">
            <CalendarX size={26} />
          </span>
          <h3 className="container-activitesproche__empty-title">
            Pas encore d'activité autour de toi
          </h3>
          <p className="container-activitesproche__empty-text">
            Sois le premier à en créer une et lance le mouvement près de chez toi !
          </p>
          <NavLink to="/mesactivités/nouvelle" className="container-activitesproche__cta">
            Créer une activité
          </NavLink>
        </div>
      ) : (
        <div className="container-autourdetoi__list">
          {recent.map((activity) => {
            const startDate = new Date(activity.startDate);
            const isMine =
              activity.creatorId === user?.id || joinedIds.has(activity.id);
            const { icon: Icon, color } = getSportVisual(activity.sportName);

            return (
              <NavLink
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="activity-card"
              >
                <div className="activity-card__photo-wrap">
                  <img
                    src={getSportPhoto(activity.sportName)}
                    alt={activity.sportName}
                    className="activity-card__photo"
                    loading="lazy"
                  />
                  <span
                    className="autourdetoi-sport-badge"
                    style={{ backgroundColor: color, color: getIconColor(color) }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                  {isMine && (
                    <span className="autourdetoi-mine-badge">Inscrit·e</span>
                  )}
                  <div className="activity-card__date">
                    <span className="activity-card__date-day">
                      {formatWeekday(startDate)}
                    </span>
                    <div className="activity-card__date-body">
                      <span className="activity-card__date-number">
                        {startDate.getDate()}
                      </span>
                      <span className="activity-card__date-month">
                        {formatMonth(startDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="activity-card__body">
                  <h3 className="activity-card__title">{activity.title}</h3>
                  <p className="activity-card__meta">
                    <MapPin size={12} strokeWidth={2.2} />
                    {activity.city}{inseeDepartmentCode ? ` (${inseeDepartmentCode})` : ""}
                  </p>
                  <p className="activity-card__meta">
                    <Users size={12} strokeWidth={2.2} />
                    {activity.participantsCount} participant
                    {activity.participantsCount > 1 ? "s" : ""}
                  </p>
                  <span
                    className="activity-card__sport"
                    style={{ background: `${color}1F`, color }}
                  >
                    {activity.sportName}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
