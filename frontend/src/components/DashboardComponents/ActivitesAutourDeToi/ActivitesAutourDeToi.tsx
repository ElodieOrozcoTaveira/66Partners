import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
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
  creatorId: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function ActivitesAutourDeToi() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities"),
      user
        ? api.get<ActivitiesResponse>("/api/activities", {
            params: { participantId: user.id },
          })
        : Promise.resolve(null),
    ])
      .then(([allRes, joinedRes]) => {
        if (!mounted) return;
        setActivities(allRes.data.activities);
        setJoinedIds(
          new Set((joinedRes?.data.activities ?? []).map((activity) => activity.id)),
        );
      })
      .catch(() => {
        if (mounted) setActivities([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

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
        <p className="container-autourdetoi__empty">
          Aucune activité récente pour le moment.
        </p>
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
                    {activity.city} (66)
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
