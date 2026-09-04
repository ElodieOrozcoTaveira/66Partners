import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
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
  creatorId: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function ProchainesActivites() {
  const { user } = useAuth();
  const [organized, setOrganized] = useState<Activity[]>([]);
  const [joined, setJoined] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities"),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: user.id },
      }),
    ])
      .then(([allRes, joinedRes]) => {
        if (!mounted) return;
        setOrganized(
          allRes.data.activities.filter((activity) => activity.creatorId === user.id),
        );
        setJoined(joinedRes.data.activities);
      })
      .catch(() => {
        if (mounted) {
          setOrganized([]);
          setJoined([]);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const next = useMemo(() => {
    const now = Date.now();
    const byId = new Map<string, Activity>();
    [...organized, ...joined].forEach((activity) => byId.set(activity.id, activity));

    return Array.from(byId.values())
      .filter(
        (activity) =>
          new Date(activity.startDate).getTime() > now &&
          activity.status !== "CANCELLED",
      )
      .sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )[0];
  }, [organized, joined]);

  return (
    <div className="container-prochaine">
      <div className="container-prochaine__header">
        <h2 className="container-prochaine__h2">Prochaines activités</h2>
        <NavLink to="/mesactivités" className="container-prochaine__link">
          Voir tout
        </NavLink>
      </div>

      {isLoading ? (
        <p className="container-prochaine__empty">Chargement...</p>
      ) : !next ? (
        <div className="container-prochaine__empty">
          <span className="container-prochaine__emptyIcon">
            <CalendarDays size={20} strokeWidth={2.2} />
          </span>
          <p>
            Tu n'as pas d'activité à venir pour le moment.
            <br />
            Découvre des activités autour de toi ou crée la tienne !
          </p>
          <NavLink to="/mesactivités/nouvelle" className="container-prochaine__emptyCta">
            Créer une activité
          </NavLink>
        </div>
      ) : (
        <NavLink to={`/activities/${next.id}`} className="prochaine-card">
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
