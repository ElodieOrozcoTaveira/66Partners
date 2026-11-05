import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronRight, Mail, MapPin, Search, Trash2, UserCheck } from "lucide-react";
import { isAxiosError } from "axios";
import { deleteAdminUser, fetchAdminUsers, type AdminUserListItem } from "../../api/adminUsers";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import AdminTerritoryFilter, { useAdminTerritoryFilter } from "../../components/AdminComponents/AdminTerritoryFilter/AdminTerritoryFilter";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import { PROVIDER_LABELS, normalizeSearch } from "../../lib/adminLabels";
import "../../components/AdminComponents/AdminPanel/AdminPanel.scss";
import "./AdminUsers.scss";
import { useTerritoryAvatar } from "../../hooks/useTerritoryAvatar";

type SortKey = "recent" | "oldest" | "organizers" | "participants" | "pseudo";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "organizers", label: "Plus d'activités créées" },
  { value: "participants", label: "Plus de participations" },
  { value: "pseudo", label: "Pseudo (A → Z)" },
];

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: AdminUserListItem[] };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminUsers() {
  const territoryAvatar = useTerritoryAvatar();
  const { territory, territoryValue, setTerritory, territories: adminTerritories } = useAdminTerritoryFilter();
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminUsers(territory)
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, [territory]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleUsers = useMemo(() => {
    if (state.status !== "ready") return [];
    const needle = normalizeSearch(query.trim());
    const filtered = needle
      ? state.data.filter((user) =>
          normalizeSearch(`${user.pseudo} ${user.email} ${user.city ?? ""}`).includes(needle),
        )
      : state.data;
    const sorted = [...filtered];
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "organizers":
        sorted.sort((a, b) => b.activitiesCreated - a.activitiesCreated);
        break;
      case "participants":
        sorted.sort((a, b) => b.participations - a.participations);
        break;
      case "pseudo":
        sorted.sort((a, b) => a.pseudo.localeCompare(b.pseudo, "fr"));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [state, query, sort]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de supprimer ce compte pour le moment.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-page__body">
        <header className="admin-users-page__header">
          <NavLink to="/admin/stats" className="admin-users-page__back" aria-label="Retour aux statistiques">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </NavLink>
          <div>
            <h1>Utilisateurs</h1>
            <p>
              {state.status === "ready"
                ? `${state.data.length} compte${state.data.length > 1 ? "s" : ""} créé${state.data.length > 1 ? "s" : ""}${
                    query ? ` · ${visibleUsers.length} affiché${visibleUsers.length > 1 ? "s" : ""}` : ""
                  }`
                : "Tous les comptes créés"}
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
              placeholder="Rechercher un pseudo, un email, une ville…"
              aria-label="Rechercher un utilisateur"
            />
          </label>
          <select
            className="admin-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Trier les utilisateurs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {state.status === "error" && (
          <ErrorBlock message="Impossible de charger la liste des utilisateurs." onRetry={load} />
        )}

        {state.status === "loading" && (
          <ul className="admin-users-page__list">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="admin-users-page__row">
                <Skeleton width={38} height={38} radius="50%" />
                <div className="admin-users-page__row-text">
                  <Skeleton width="55%" height="0.9rem" />
                  <Skeleton width="40%" height="0.75rem" className="admin-users-page__gap-top" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {state.status === "ready" && (
          <ul className="admin-users-page__list">
            {visibleUsers.map((user) => (
              <li key={user.id} className="admin-users-page__row">
                <Link
                  to={`/admin/utilisateurs/${user.id}`}
                  className="admin-users-page__link"
                  aria-label={`Voir la fiche de ${user.pseudo}`}
                >
                  <img
                    src={user.avatar || territoryAvatar(user.defaultTerritory)}
                    alt=""
                    className="admin-users-page__avatar"
                  />
                  <div className="admin-users-page__row-text">
                    <strong>{user.pseudo}</strong>
                    <span className="admin-users-page__city">
                      <Mail size={12} strokeWidth={2.2} />
                      {user.email}
                    </span>
                    <span className="admin-users-page__city">
                      <MapPin size={12} strokeWidth={2.2} />
                      {user.city ?? "Ville non renseignée"} · {user.territories.length > 0 ? user.territories.join(", ") : "—"}
                    </span>
                    <span className="admin-users-page__counts">
                      <span title="Activités créées">
                        <CalendarDays size={12} strokeWidth={2.2} /> {user.activitiesCreated} créée{user.activitiesCreated > 1 ? "s" : ""}
                      </span>
                      <span title="Demandes de participation">
                        <UserCheck size={12} strokeWidth={2.2} /> {user.participations} participation{user.participations > 1 ? "s" : ""}
                      </span>
                      {user.providers.map((provider) => (
                        <span key={provider} className="admin-users-page__provider">
                          {PROVIDER_LABELS[provider] ?? provider}
                        </span>
                      ))}
                    </span>
                  </div>
                  <span className="admin-users-page__date">{dateFormatter.format(new Date(user.createdAt))}</span>
                  <ChevronRight size={16} strokeWidth={2.2} className="admin-users-page__chevron" />
                </Link>
                <button
                  type="button"
                  className="admin-users-page__delete"
                  onClick={() => setDeleteTarget(user)}
                  aria-label={`Supprimer le compte de ${user.pseudo}`}
                >
                  <Trash2 size={16} strokeWidth={2.2} />
                </button>
              </li>
            ))}
            {state.data.length > 0 && visibleUsers.length === 0 && (
              <li className="admin-users-page__empty">Aucun utilisateur ne correspond à « {query} ».</li>
            )}
            {state.data.length === 0 && (
              <li className="admin-users-page__empty">Aucun utilisateur pour l'instant.</li>
            )}
          </ul>
        )}
      </div>
      <AdminBottomNav />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Supprimer le compte de ${deleteTarget?.pseudo ?? ""} ?`}
        description="Cette action est définitive : le compte et les données personnelles associées seront supprimés. Les activités créées par cet utilisateur resteront visibles pour les autres participants."
        isSubmitting={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
