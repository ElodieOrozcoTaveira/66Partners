import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
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
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function ActivitesAutourDeToi() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<ActivitiesResponse>("/api/activities")
      .then((res) => {
        if (mounted) setActivities(res.data.activities);
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
  }, []);

  const recent = useMemo(() => {
    return [...activities]
      .filter((activity) => activity.status !== "CANCELLED")
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, RECENT_COUNT);
  }, [activities]);

  return (
    <div className="container-autourdetoi">
      <h2 className="container-autourdetoi__h2">Activités autour de toi</h2>

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
            const { color } = getSportVisual(activity.sportName);

            return (
              <NavLink key={activity.id} to="/explorer" className="activity-card">
                <div className="activity-card__photo-wrap">
                  <img
                    src={getSportPhoto(activity.sportName)}
                    alt={activity.sportName}
                    className="activity-card__photo"
                  />
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
                  <p className="activity-card__meta">{activity.city} (66)</p>
                  <span
                    className="activity-card__sport"
                    style={{ backgroundColor: color, color: getIconColor(color) }}
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
