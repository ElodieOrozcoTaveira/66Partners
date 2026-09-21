import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft, MapPin, Trash2 } from "lucide-react";
import { isAxiosError } from "axios";
import { deleteAdminUser, fetchAdminUsers, type AdminUserListItem } from "../../api/adminUsers";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import "./AdminUsers.scss";

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: AdminUserListItem[] };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminUsers() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminUsers()
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
                ? `${state.data.length} compte${state.data.length > 1 ? "s" : ""} créé${state.data.length > 1 ? "s" : ""}`
                : "Tous les comptes créés sur 66Partners"}
            </p>
          </div>
        </header>

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
            {state.data.map((user) => (
              <li key={user.id} className="admin-users-page__row">
                <img
                  src={user.avatar || "/avatardefault.webp"}
                  alt={`Photo de profil de ${user.pseudo}`}
                  className="admin-users-page__avatar"
                />
                <div className="admin-users-page__row-text">
                  <strong>{user.pseudo}</strong>
                  <span className="admin-users-page__city">
                    <MapPin size={12} strokeWidth={2.2} />
                    {user.city ?? "Ville non renseignée"}
                  </span>
                </div>
                <span className="admin-users-page__date">{dateFormatter.format(new Date(user.createdAt))}</span>
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
