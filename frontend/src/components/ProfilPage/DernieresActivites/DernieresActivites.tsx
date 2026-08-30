import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { formatDayMonth, formatWeekdayShort } from "../../../lib/dateFormat";
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

interface TaggedActivity extends Activity {
  tag: "Organisée" | "Rejoint(e)";
}

const DISPLAY_COUNT = 3;

export default function DernieresActivites({ userId }: DernieresActivitesProps) {
  const [activities, setActivities] = useState<TaggedActivity[]>([]);
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
        const organized: TaggedActivity[] = allRes.data.activities
          .filter((a) => a.creatorId === userId && a.status !== "CANCELLED")
          .map((a) => ({ ...a, tag: "Organisée" as const }));
        const joined: TaggedActivity[] = joinedRes.data.activities
          .filter((a) => a.status !== "CANCELLED")
          .map((a) => ({ ...a, tag: "Rejoint(e)" as const }));

        const byId = new Map<string, TaggedActivity>();
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
        <h2>Mes dernières activités</h2>
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

            return (
              <NavLink
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="dernieresActivites-item"
              >
                <span
                  className="dernieresActivites-item__badge"
                  style={{ backgroundColor: color, color: getIconColor(color) }}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="dernieresActivites-item__body">
                  <h3>{activity.title}</h3>
                  <p>
                    {formatWeekdayShort(startDate)} {formatDayMonth(startDate)} ·{" "}
                    {activity.participantsCount} participants
                  </p>
                </div>
                <span
                  className={`dernieresActivites-item__tag dernieresActivites-item__tag--${
                    activity.tag === "Organisée" ? "organized" : "joined"
                  }`}
                >
                  {activity.tag}
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
