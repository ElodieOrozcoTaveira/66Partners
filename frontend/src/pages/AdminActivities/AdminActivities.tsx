import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, User } from "lucide-react";
import { fetchAdminActivities, type AdminActivityListItem } from "../../api/adminActivities";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import AdminTerritoryFilter, { useAdminTerritoryFilter } from "../../components/AdminComponents/AdminTerritoryFilter/AdminTerritoryFilter";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import "./AdminActivities.scss";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: AdminActivityListItem[] };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminActivities() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const { territory, territoryValue, setTerritory, territories: adminTerritories } = useAdminTerritoryFilter();

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminActivities(territory)
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, [territory]);

  useEffect(() => {
    load();
  }, [load]);

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
                ? `${state.data.length} activité${state.data.length > 1 ? "s" : ""} créée${state.data.length > 1 ? "s" : ""}`
                : "Toutes les activités créées"}
            </p>
          </div>
        </header>

        <AdminTerritoryFilter value={territoryValue} onChange={setTerritory} territories={adminTerritories} />

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
            {state.data.map((activity) => {
              const sportVisual = getSportVisual(activity.sportName);
              const SportIcon = sportVisual.icon;
              return (
              <li key={activity.id} className="admin-activities-page__row">
                <span
                  className="admin-activities-page__sport-icon"
                  style={{ backgroundColor: sportVisual.color, color: getIconColor(sportVisual.color) }}
                  title={activity.sportName}
                >
                  <SportIcon size={16} strokeWidth={2.2} />
                </span>
                <div className="admin-activities-page__row-text">
                  <strong>{activity.title}</strong>
                  <span className="admin-activities-page__meta">
                    <span className="admin-activities-page__meta-item">
                      <MapPin size={12} strokeWidth={2.2} />
                      {activity.city}
                    </span>
                    <span className="admin-activities-page__meta-item">
                      <CalendarDays size={12} strokeWidth={2.2} />
                      {dateFormatter.format(new Date(activity.startDate))}
                    </span>
                    <span className="admin-activities-page__meta-item">
                      <User size={12} strokeWidth={2.2} />
                      {activity.creatorPseudo ?? "Compte supprimé"}
                    </span>
                  </span>
                </div>
                <span className="admin-activities-page__date">
                  Créée le {dateFormatter.format(new Date(activity.createdAt))}
                </span>
              </li>
              );
            })}
            {state.data.length === 0 && (
              <li className="admin-activities-page__empty">Aucune activité pour l'instant.</li>
            )}
          </ul>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
