import { useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { CalendarPlus, Navigation, Users } from "lucide-react";
import api from "../../lib/axios";
import { useTerritory } from "../../contexts/TerritoryContext";
import Recherche from "../../components/SportsComponents/Recherche/Recheche";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import { type ActivityLevel } from "../../lib/activityLabels";
import ActivityCard from "../../components/ActivityCard/ActivityCard";
import { useUserLocation } from "../../hooks/useUserLocation";
import { useNearbyCount } from "../../hooks/useNearbyCount";
import { DEFAULT_SEARCH_RADIUS_KM, distanceKm, nearbyLabel } from "../../lib/geo";
import { DATE_PRESET_LABELS, presetToRange, type DatePreset } from "../../lib/parisDateRange";
import "./Explorer.scss";
import { useBranding } from "../../contexts/TerritoryContext";
import { AUDIENCE_LABELS, AUDIENCE_OPTIONS, type ActivityAudience } from "../../lib/audience";

const DATE_PRESETS: DatePreset[] = ["all", "today", "tomorrow", "week", "weekend", "month"];

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
  creatorPseudo: string | null;
  creatorAvatar: string | null;
  audience: ActivityAudience;
  latitude?: number | null;
  longitude?: number | null;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function Explorer() {
  const { brandName, territoryOf } = useBranding();
  // « Autour de moi » : position demandée seulement au clic (ou déjà accordée).
  const location = useUserLocation();
  const nearby = useNearbyCount(location.coords);
  const [aroundMe, setAroundMe] = useState(false);
  const { activeTerritory } = useTerritory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const selectedSportId = searchParams.get("sport");
  // Filtre « Public » (?public=WOMEN|MEN) ; absent = toutes les activités.
  const rawAudience = searchParams.get("public");
  const audienceFilter: ActivityAudience =
    rawAudience === "WOMEN" || rawAudience === "MEN" ? rawAudience : "ALL";
  const rawPreset = searchParams.get("when");
  const datePreset: DatePreset = (DATE_PRESETS as string[]).includes(rawPreset ?? "")
    ? (rawPreset as DatePreset)
    : "all";
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Le territoire actif se résout de façon asynchrone au premier montage
    // (TerritoryContext) : attendre qu'il soit prêt évite un appel sans
    // territoire, désormais refusé par le backend (cf. audit P-01).
    if (!activeTerritory) return;
    setIsLoading(true);
    // Toujours au minimum "à venir" (cf. chantier filtres de date) : "Toutes"
    // ne veut jamais dire "y compris le passé" dans une liste publique —
    // bornes calculées sur le calendrier Europe/Paris, jamais le fuseau du
    // navigateur (cf. parisDateRange.ts).
    const { from, to } = presetToRange(datePreset);
    Promise.all([
      api.get<ActivitiesResponse>("/api/activities", {
        params: { territory: activeTerritory.code, from, to },
      }),
      api.get<SportsResponse>("/api/sports"),
    ])
      .then(([activitiesRes, sportsRes]) => {
        setActivities(activitiesRes.data.activities);
        setSports(sportsRes.data.sports);
      })
      .catch(() => setError("Impossible de charger les activités."))
      .finally(() => setIsLoading(false));
  }, [activeTerritory, datePreset]);

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
      .filter((activity) => audienceFilter === "ALL" || activity.audience === audienceFilter)
      .filter((activity) => !query || activity.title.toLowerCase().includes(query))
      .filter((activity) => {
        if (!aroundMe || !location.coords) return true;
        if (activity.latitude == null || activity.longitude == null) return false;
        return (
          distanceKm(location.coords, { latitude: activity.latitude, longitude: activity.longitude }) <=
          DEFAULT_SEARCH_RADIUS_KM
        );
      });
  }, [activities, selectedSportId, audienceFilter, search, aroundMe, location.coords]);

  async function toggleAroundMe() {
    if (aroundMe) {
      setAroundMe(false);
      return;
    }
    const coords = location.coords ?? (await location.locate());
    if (coords) setAroundMe(true);
  }

  if (isLoading)
    return <p className="explorer-state">Chargement des activités...</p>;
  if (error) return <p className="explorer-state">{error}</p>;

  return (
    <div className="container-explorer">
      <span className="eyebrow">{brandName}</span>
      <h1 className="container-explorer__titre">
        Les activités {territoryOf}
      </h1>
      <p className="container-explorer__soustitre">
        Découvre les sorties sportives proposées par la communauté près de chez
        toi.
      </p>

      <div className="container-explorer__around">
        <button
          type="button"
          className={`around-toggle${aroundMe ? " around-toggle--active" : ""}`}
          aria-pressed={aroundMe}
          onClick={() => void toggleAroundMe()}
          disabled={location.status === "locating"}
        >
          <Navigation size={16} />
          {location.status === "locating"
            ? "Localisation…"
            : `Autour de moi · ${DEFAULT_SEARCH_RADIUS_KM} km`}
        </button>
        {nearby ? (
          <span className="around-count">
            <Users size={15} /> {nearbyLabel(nearby.count, nearby.radiusKm)}
          </span>
        ) : location.status === "denied" ? (
          <span className="around-hint">
            Autorise la localisation dans ton navigateur pour voir les sorties autour de toi.
          </span>
        ) : null}
      </div>

      <Recherche
        value={search}
        onChange={setSearch}
        placeholder="Rechercher une activité..."
      />

      <div className="container-explorer__filters">
        {DATE_PRESETS.map((preset) => {
          const isActive = datePreset === preset;
          return (
            <button
              key={preset}
              type="button"
              className={`filter-chip${isActive ? " filter-chip--active" : ""}`}
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (preset === "all") next.delete("when");
                  else next.set("when", preset);
                  return next;
                })
              }
            >
              {DATE_PRESET_LABELS[preset]}
            </button>
          );
        })}
      </div>

      <div className="container-explorer__filters" role="radiogroup" aria-label="Public">
        {AUDIENCE_OPTIONS.map((audience) => (
          <button
            key={audience}
            type="button"
            role="radio"
            aria-checked={audienceFilter === audience}
            className={`filter-chip${audienceFilter === audience ? " filter-chip--active" : ""}`}
            onClick={() =>
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (audience === "ALL") next.delete("public");
                else next.set("public", audience);
                return next;
              })
            }
          >
            {audience === "ALL" ? "Tous publics" : AUDIENCE_LABELS[audience]}
          </button>
        ))}
      </div>

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
        search.trim() || selectedSportId || audienceFilter !== "ALL" || aroundMe ? (
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
          {filteredActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} from={location.coords} />
          ))}
        </div>
      )}
    </div>
  );
}
