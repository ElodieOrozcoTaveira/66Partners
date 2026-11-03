import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronRight, Clock, MapPin, Search, User, Users } from "lucide-react";
import { fetchAdminActivities, type AdminActivityListItem } from "../../api/adminActivities";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import {
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_ORDER,
  dateFormatter,
  normalizeSearch,
} from "../../lib/adminLabels";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import AdminTerritoryFilter, { useAdminTerritoryFilter } from "../../components/AdminComponents/AdminTerritoryFilter/AdminTerritoryFilter";
import { StatusBadge } from "../../components/AdminComponents/AdminPanel/AdminPanel";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import "../../components/AdminComponents/AdminPanel/AdminPanel.scss";
import "./AdminActivities.scss";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: AdminActivityListItem[] };

type TimeFilter = "all" | "upcoming" | "past";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passées" },
];

export default function AdminActivities() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const { territory, territoryValue, setTerritory, territories: adminTerritories } = useAdminTerritoryFilter();
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminActivities(territory)
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, [territory]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (state.status !== "ready") return [];
    const needle = normalizeSearch(query.trim());
    const now = Date.now();
    return state.data.filter((activity) => {
      if (statusFilter && activity.status !== statusFilter) return false;
      const start = new Date(activity.startDate).getTime();
      if (timeFilter === "upcoming" && start < now) return false;
      if (timeFilter === "past" && start >= now) return false;
      if (!needle) return true;
      return normalizeSearch(
        `${activity.title} ${activity.sportName} ${activity.city} ${activity.creatorPseudo ?? ""}`,
      ).includes(needle);
    });
  }, [state, query, timeFilter, statusFilter]);

  const total = state.status === "ready" ? state.data.length : 0;
  const isFiltered = Boolean(query || statusFilter || timeFilter !== "all");

  return (
    <div className="admin-activities-page">
      <div className="admin-activities-page__body">
        <header className="admin-activities-page__header">
          <NavLink to="/admin/stats" className="admin-activities-page__back" aria-label="Retour aux statistiques">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </NavLink>
          <div>
            <h1>Activités</h1>
            <p>
              {state.status === "ready"
                ? `${total} activité${total > 1 ? "s" : ""} créée${total > 1 ? "s" : ""}${
                    isFiltered ? ` · ${visible.length} affichée${visible.length > 1 ? "s" : ""}` : ""
                  }`
                : "Toutes les activités créées"}
            </p>
          </div>
        </header>

        <AdminTerritoryFilter value={territoryValue} onChange={setTerritory} territories={adminTerritories} />

        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} strokeWidth={2.2} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un titre, un sport, une ville, un organisateur…"
              aria-label="Rechercher une activité"
            />
          </label>
          <div className="admin-chips" role="group" aria-label="Filtrer par date">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className="admin-chip"
                aria-pressed={timeFilter === filter.value}
                onClick={() => setTimeFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="admin-chips" role="group" aria-label="Filtrer par statut">
            <button
              type="button"
              className="admin-chip"
              aria-pressed={statusFilter === null}
              onClick={() => setStatusFilter(null)}
            >
              Tous les statuts
            </button>
            {ACTIVITY_STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                className="admin-chip"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              >
                {ACTIVITY_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {state.status === "error" && (
          <ErrorBlock message="Impossible de charger la liste des activités." onRetry={load} />
        )}

        {state.status === "loading" && (
          <ul className="admin-activities-page__list">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="admin-activities-page__row">
                <div className="admin-activities-page__row-text">
                  <Skeleton width="65%" height="0.95rem" />
                  <Skeleton width="45%" height="0.75rem" className="admin-activities-page__gap-top" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {state.status === "ready" && (
          <ul className="admin-activities-page__list">
            {visible.map((activity) => {
              const sportVisual = getSportVisual(activity.sportName);
              const SportIcon = sportVisual.icon;
              const full = activity.participantsCount >= activity.maxParticipants;
              return (
                <li key={activity.id}>
                  <Link to={`/admin/activites/${activity.id}`} className="admin-activities-page__row admin-activities-page__row--link">
                    <span
                      className="admin-activities-page__sport-icon"
                      style={{ backgroundColor: sportVisual.color, color: getIconColor(sportVisual.color) }}
                      title={activity.sportName}
                    >
                      <SportIcon size={16} strokeWidth={2.2} />
                    </span>
                    <div className="admin-activities-page__row-text">
                      <span className="admin-activities-page__title-line">
                        <strong>{activity.title}</strong>
                        <StatusBadge
                          label={ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
                          color={ACTIVITY_STATUS_COLORS[activity.status] ?? "#64748b"}
                        />
                      </span>
                      <span className="admin-activities-page__meta">
                        <span className="admin-activities-page__meta-item">
                          <MapPin size={12} strokeWidth={2.2} />
                          {activity.city} · {activity.territoryCode}
                        </span>
                        <span className="admin-activities-page__meta-item">
                          <CalendarDays size={12} strokeWidth={2.2} />
                          {dateFormatter.format(new Date(activity.startDate))}
                        </span>
                        <span className="admin-activities-page__meta-item">
                          <User size={12} strokeWidth={2.2} />
                          {activity.creatorPseudo ?? "Compte supprimé"}
                        </span>
                        <span className={`admin-activities-page__meta-item${full ? " admin-activities-page__meta-item--full" : ""}`}>
                          <Users size={12} strokeWidth={2.2} />
                          {activity.participantsCount}/{activity.maxParticipants}
                        </span>
                        {activity.pendingCount > 0 && (
                          <span className="admin-activities-page__meta-item admin-activities-page__meta-item--pending">
                            <Clock size={12} strokeWidth={2.2} />
                            {activity.pendingCount} en attente
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="admin-activities-page__date">
                      Créée le {dateFormatter.format(new Date(activity.createdAt))}
                    </span>
                    <ChevronRight size={16} strokeWidth={2.2} className="admin-activities-page__chevron" />
                  </Link>
                </li>
              );
            })}
            {state.data.length === 0 && (
              <li className="admin-activities-page__empty">Aucune activité pour l'instant.</li>
            )}
            {state.data.length > 0 && visible.length === 0 && (
              <li className="admin-activities-page__empty">Aucune activité ne correspond à ces filtres.</li>
            )}
          </ul>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
