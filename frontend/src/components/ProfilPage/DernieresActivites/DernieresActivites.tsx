import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Check, Flame } from "lucide-react";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
import { formatDayMonthYear } from "../../../lib/dateFormat";
import "./DernieresActivites.scss";

interface Activity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  status: string;
  sportName: string;
  participantsCount: number;
  creatorId: string;
}

interface ActivitiesResponse {
  activities: Activity[];
}

interface DernieresActivitesProps {
  userId: string | null;
}

const DISPLAY_COUNT = 3;

const STATUS_INFO: Record<string, { label: string; tone: "done" | "confirmed" | "pending" }> = {
  COMPLETED: { label: "Terminée", tone: "done" },
  CONFIRMED: { label: "Confirmée", tone: "confirmed" },
  PENDING: { label: "En attente", tone: "pending" },
};

export default function DernieresActivites({ userId }: DernieresActivitesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities"),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: userId },
      }),
    ])
      .then(([allRes, joinedRes]) => {
        if (!mounted) return;
        const organized = allRes.data.activities.filter(
          (a) => a.creatorId === userId && a.status !== "CANCELLED",
        );
        const joined = joinedRes.data.activities.filter((a) => a.status !== "CANCELLED");

        const byId = new Map<string, Activity>();
        [...organized, ...joined].forEach((activity) => byId.set(activity.id, activity));

        const merged = Array.from(byId.values()).sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );

        setActivities(merged);
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
  }, [userId]);

  if (!userId) return null;

  const recent = activities.slice(0, DISPLAY_COUNT);

  return (
    <div className="container-dernieresActivites">
      <div className="container-dernieresActivites__header">
        <h2>
          <Flame size={14} strokeWidth={2.4} />
          Mes dernières activités
        </h2>
        <NavLink to="/mesactivités" className="container-dernieresActivites__link">
          Voir tout
        </NavLink>
      </div>

      {isLoading ? (
        <p className="container-dernieresActivites__empty">Chargement...</p>
      ) : recent.length === 0 ? (
        <p className="container-dernieresActivites__empty">
          Aucune activité pour l'instant.
        </p>
      ) : (
        <div className="container-dernieresActivites__list">
          {recent.map((activity) => {
            const { icon: Icon, color } = getSportVisual(activity.sportName);
            const startDate = new Date(activity.startDate);
            const status = STATUS_INFO[activity.status];

            return (
              <NavLink
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="dernieresActivites-card"
              >
                <div className="dernieresActivites-card__photo-wrap">
                  <img
                    src={getSportPhoto(activity.sportName)}
                    alt={activity.sportName}
                    className="dernieresActivites-card__photo"
                  />
                  <span
                    className="dernieresActivites-card__badge"
                    style={{ backgroundColor: color, color: getIconColor(color) }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                </div>
                <div className="dernieresActivites-card__body">
                  <h3>{activity.title}</h3>
                  <p>
                    {formatDayMonthYear(startDate)} · {activity.participantsCount} participant
                    {activity.participantsCount > 1 ? "s" : ""}
                  </p>
                  {status && (
                    <span
                      className={`dernieresActivites-card__status dernieresActivites-card__status--${status.tone}`}
                    >
                      {status.tone === "done" && <Check size={11} strokeWidth={3} />}
                      {status.label}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
