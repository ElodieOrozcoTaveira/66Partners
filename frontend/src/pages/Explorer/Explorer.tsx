import { useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { CalendarPlus, Clock, MapPin, Users } from "lucide-react";
import api from "../../lib/axios";
import { useTerritory } from "../../contexts/TerritoryContext";
import Recherche from "../../components/SportsComponents/Recherche/Recheche";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import { getSportPhoto } from "../../lib/sportPhotos";
import { LEVEL_LABELS, type ActivityLevel } from "../../lib/activityLabels";
import { formatMonth, formatWeekday } from "../../lib/dateFormat";
import "./Explorer.scss";

type ActivityStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

interface Sport {
  id: string;
  name: string;
}

interface Activity {
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
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: "Ouverte",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export default function Explorer() {
  const { activeTerritory } = useTerritory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const selectedSportId = searchParams.get("sport");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get<ActivitiesResponse>("/api/activities", {
        params: activeTerritory ? { territory: activeTerritory.code } : undefined,
      }),
      api.get<SportsResponse>("/api/sports"),
    ])
      .then(([activitiesRes, sportsRes]) => {
        setActivities(activitiesRes.data.activities);
        setSports(sportsRes.data.sports);
      })
      .catch(() => setError("Impossible de charger les activités."))
      .finally(() => setIsLoading(false));
  }, [activeTerritory]);

  const practicedSportIds = useMemo(
    () => new Set(activities.map((activity) => activity.sportId)),
    [activities],
  );

  const availableSports = useMemo(
    () => sports.filter((sport) => practicedSportIds.has(sport.id)),
    [sports, practicedSportIds],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return activities
      .filter((activity) => !selectedSportId || activity.sportId === selectedSportId)
      .filter((activity) => !query || activity.title.toLowerCase().includes(query));
  }, [activities, selectedSportId, search]);

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

      <Recherche
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une activité..."
      />

      {availableSports.length > 0 && (
        <div className="container-explorer__filters">
          <button
            type="button"
            className={`filter-chip${selectedSportId === null ? " filter-chip--active" : ""}`}
            onClick={() =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("sport");
                return next;
              })
            }
          >
            Tous
          </button>
          {availableSports.map((sport) => {
            const { icon: Icon, color } = getSportVisual(sport.name);
            const isActive = selectedSportId === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                className={`filter-chip${isActive ? " filter-chip--active" : ""}`}
                style={isActive ? { backgroundColor: color, borderColor: color } : undefined}
                onClick={() =>
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("sport", sport.id);
                    return next;
                  })
                }
              >
                <Icon size={14} color={isActive ? getIconColor(color) : color} />
                {sport.name}
              </button>
            );
          })}
        </div>
      )}

      {filteredActivities.length === 0 ? (
        search.trim() || selectedSportId ? (
          <p className="explorer-state">
            Aucune activité ne correspond à ta recherche.
          </p>
        ) : (
          <div className="container-explorer__empty">
            <span className="container-explorer__empty-icon">
              <CalendarPlus size={26} />
            </span>
            <h2 className="container-explorer__empty-title">
              Pas encore d'activité
            </h2>
            <p className="container-explorer__empty-text">
              Sois le premier à proposer une sortie, une séance ou une activité
              près de chez toi !
            </p>
            <NavLink
              to="/mesactivités/nouvelle"
              className="container-explorer__empty-cta"
            >
              Créer une activité
            </NavLink>
          </div>
        )
      ) : (
        <div className="container-explorer__grid">
          {filteredActivities.map((activity) => {
            const { icon: Icon, color } = getSportVisual(activity.sportName);
            const startDate = new Date(activity.startDate);
            const isFull = activity.participantsCount >= activity.maxParticipants;

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
                  <div className="activity-card__photo-overlay" />

                  <span
                    className="activity-card__sport-badge"
                    style={{ backgroundColor: color }}
                  >
                    <Icon size={16} color={getIconColor(color)} />
                    {activity.sportName}
                  </span>

                  {activity.status !== "PENDING" && (
                    <span
                      className={`activity-card__status activity-card__status--${activity.status.toLowerCase()}`}
                    >
                      {STATUS_LABELS[activity.status]}
                    </span>
                  )}

                  <div className="activity-card__date">
                    <span className="activity-card__date-day">
                      {formatWeekday(startDate)}
                    </span>
                    <span className="activity-card__date-number">
                      {startDate.getDate()}
                    </span>
                    <span className="activity-card__date-month">
                      {formatMonth(startDate)}
                    </span>
                  </div>
                </div>

                <div className="activity-card__body">
                  <h2 className="activity-card__title">{activity.title}</h2>

                  <div className="activity-card__meta">
                    <span>
                      <MapPin size={14} />
                      {activity.city}
                    </span>
                    <span>
                      <Clock size={14} />
                      {timeFormatter.format(startDate)}
                    </span>
                  </div>

                  <div className="activity-card__footer">
                    <span className="activity-card__level">
                      {LEVEL_LABELS[activity.levelRequired]}
                    </span>
                    <span
                      className={`activity-card__participants${isFull ? " activity-card__participants--full" : ""}`}
                    >
                      <Users size={14} />
                      {activity.participantsCount}/{activity.maxParticipants}
                    </span>
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
