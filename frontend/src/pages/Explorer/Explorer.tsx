import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import "./Explorer.scss";

interface Sport {
  id: string;
  name: string;
}

type ActivityLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
type ActivityStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  city: string;
  startDate: string;
  levelRequired: ActivityLevel;
  maxParticipants: number;
  status: ActivityStatus;
  sportId: string;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

const LEVEL_LABELS: Record<ActivityLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

const STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: "Ouverte",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Explorer() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<ActivitiesResponse>("/api/activities"),
      api.get<SportsResponse>("/api/sports"),
    ])
      .then(([activitiesRes, sportsRes]) => {
        setActivities(activitiesRes.data.activities);
        setSports(sportsRes.data.sports);
      })
      .catch(() => setError("Impossible de charger les activités."))
      .finally(() => setIsLoading(false));
  }, []);

  const sportsById = useMemo(
    () => new Map(sports.map((sport) => [sport.id, sport.name])),
    [sports],
  );

  if (isLoading)
    return <p className="explorer-state">Chargement des activités...</p>;
  if (error) return <p className="explorer-state">{error}</p>;

  return (
    <div className="container-explorer">
      <h1 className="container-explorer__titre">
        Les activités des 66Partners
      </h1>
      <p className="container-explorer__soustitre">
        Découvre les sorties sportives proposées par la communauté près de chez
        toi.
      </p>

      {activities.length === 0 ? (
        <p className="explorer-state">Aucune activité pour le moment.</p>
      ) : (
        <ul className="container-explorer__list">
          {activities.map((activity) => {
            const sportName = sportsById.get(activity.sportId) ?? "Sport";
            const { icon: Icon, color } = getSportVisual(sportName);

            return (
              <li key={activity.id} className="activity-card">
                <span
                  className="activity-card__circle"
                  style={{ backgroundColor: color }}
                >
                  <Icon color={getIconColor(color)} size={20} />
                </span>
                <div className="activity-card__body">
                  <h2 className="activity-card__title">{activity.title}</h2>
                  <p className="activity-card__meta">
                    {sportName} · {activity.city} ·{" "}
                    {dateFormatter.format(new Date(activity.startDate))}
                  </p>
                  <div className="activity-card__tags">
                    <span className="activity-card__tag">
                      {LEVEL_LABELS[activity.levelRequired]}
                    </span>
                    <span className="activity-card__tag">
                      Max {activity.maxParticipants} pers.
                    </span>
                    <span
                      className={`activity-card__tag activity-card__tag--${activity.status.toLowerCase()}`}
                    >
                      {STATUS_LABELS[activity.status]}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
