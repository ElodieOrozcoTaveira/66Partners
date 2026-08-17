import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { formatMonth, formatTime, formatWeekday } from "../../../lib/dateFormat";
import "./ProchainesActivites.scss";

interface Activity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  status: string;
  sportName: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function ProchainesActivites() {
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

  const next = useMemo(() => {
    const now = Date.now();
    return activities
      .filter(
        (activity) =>
          new Date(activity.startDate).getTime() > now &&
          activity.status !== "CANCELLED",
      )
      .sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )[0];
  }, [activities]);

  return (
    <div className="container-prochaine">
      <div className="container-prochaine__header">
        <h2 className="container-prochaine__h2">Prochaines activités</h2>
        <NavLink to="/explorer" className="container-prochaine__link">
          Voir tout
        </NavLink>
      </div>

      {isLoading ? (
        <p className="container-prochaine__empty">Chargement...</p>
      ) : !next ? (
        <p className="container-prochaine__empty">
          Aucune activité à venir pour le moment.
        </p>
      ) : (
        <NavLink to="/explorer" className="prochaine-card">
          {(() => {
            const { icon: Icon, color } = getSportVisual(next.sportName);
            const startDate = new Date(next.startDate);
            return (
              <>
                <span
                  className="prochaine-card__badge"
                  style={{ backgroundColor: color }}
                >
                  <Icon color={getIconColor(color)} size={20} />
                </span>
                <div className="prochaine-card__body">
                  <h3 className="prochaine-card__title">{next.title}</h3>
                  <p className="prochaine-card__meta">
                    {next.sportName} · {next.city}
                  </p>
                  <p className="prochaine-card__date">
                    {formatWeekday(startDate)} {startDate.getDate()}{" "}
                    {formatMonth(startDate)} · {formatTime(startDate)}
                  </p>
                </div>
              </>
            );
          })()}
        </NavLink>
      )}
    </div>
  );
}
