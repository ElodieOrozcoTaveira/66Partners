import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Bell,
  Camera,
  CalendarDays,
  MessageCircle,
  Trash2,
  UserCheck,
} from "lucide-react";
import { deleteAdminUser, fetchAdminUser, type AdminUserDetail as UserDetail } from "../../api/adminUsers";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import { MiniStat, Panel, StatusBadge } from "../../components/AdminComponents/AdminPanel/AdminPanel";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { useBranding } from "../../contexts/TerritoryContext";
import {
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_STATUS_LABELS,
  PARTICIPATION_STATUS_COLORS,
  PARTICIPATION_STATUS_LABELS,
  PROVIDER_LABELS,
  WEEKDAY_LABELS,
  dateFormatter,
  dateTimeFormatter,
} from "../../lib/adminLabels";
import "../../components/AdminComponents/AdminPanel/AdminPanel.scss";
import "./AdminUserDetail.scss";

type State =
  | { status: "loading" }
  | { status: "error"; notFound: boolean }
  | { status: "ready"; data: UserDetail };

/** Fiche complète d'un compte : profil, territoires, sports, historique. */
export default function AdminUserDetail() {
  const { userId = "" } = useParams();
  const navigate = useNavigate();
  const { asset } = useBranding();
  const [state, setState] = useState<State>({ status: "loading" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminUser(userId)
      .then((data) => setState({ status: "ready", data }))
      .catch((err) =>
        setState({ status: "error", notFound: isAxiosError(err) && err.response?.status === 404 }),
      );
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminUser(userId);
      navigate("/admin/utilisateurs", { replace: true });
    } catch (err) {
      setDeleteError(
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de supprimer ce compte pour le moment.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const user = state.status === "ready" ? state.data : null;

  return (
    <div className="admin-page">
      <div className="admin-page__body">
        <header className="admin-page__header">
          <button type="button" className="admin-page__back" onClick={() => navigate(-1)} aria-label="Retour">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <div>
            <h1>{user ? user.pseudo : "Fiche utilisateur"}</h1>
            <p>{user ? `Inscrit le ${dateFormatter.format(new Date(user.createdAt))}` : "Chargement…"}</p>
          </div>
        </header>

        {state.status === "error" && (
          <div className="admin-panel">
            {state.notFound ? (
              <p className="admin-rows__empty">
                Ce compte n'existe plus. <Link to="/admin/utilisateurs">Retour à la liste</Link>
              </p>
            ) : (
              <ErrorBlock message="Impossible de charger cette fiche." onRetry={load} />
            )}
          </div>
        )}

        {state.status === "loading" && (
          <div className="admin-panel admin-user-detail__identity">
            <Skeleton width={72} height={72} radius="50%" />
            <div className="admin-user-detail__identity-text">
              <Skeleton width="50%" height="1.1rem" />
              <Skeleton width="70%" height="0.8rem" />
              <Skeleton width="40%" height="0.8rem" />
            </div>
          </div>
        )}

        {user && (
          <>
            <div className="admin-panel admin-user-detail__identity">
              <img src={user.avatar || asset("avatarDefault")} alt="" className="admin-user-detail__avatar" />
              <div className="admin-user-detail__identity-text">
                <strong>{user.pseudo}</strong>
                <a href={`mailto:${user.email}`}>{user.email}</a>
                <span>{user.city ?? "Ville non renseignée"}</span>
                {user.headline ? <em>« {user.headline} »</em> : null}
              </div>
            </div>

            <div className="admin-page__grid">
              <MiniStat icon={CalendarDays} label="Activités créées" value={user.counts.activitiesCreated} />
              <MiniStat
                icon={UserCheck}
                label="Participations"
                value={user.counts.participations}
                hint={`${user.counts.participationsAccepted} acceptée${user.counts.participationsAccepted > 1 ? "s" : ""}`}
              />
              <MiniStat icon={MessageCircle} label="Messages envoyés" value={user.counts.messagesSent} />
              <MiniStat icon={Camera} label="Photos partagées" value={user.counts.photos} />
              <MiniStat icon={Bell} label="Notifs non lues" value={user.counts.notificationsUnread} />
              <MiniStat label="Notifs push" value={user.pushEnabled ? "Oui" : "Non"} />
            </div>

            <div className="admin-page__two-cols">
              <Panel title="Compte">
                <dl className="admin-facts">
                  <dt>Connexion</dt>
                  <dd>
                    {[user.hasPassword ? "Mot de passe" : null, ...user.providers.map((p) => PROVIDER_LABELS[p] ?? p)]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </dd>
                  <dt>Inscription</dt>
                  <dd>{dateTimeFormatter.format(new Date(user.createdAt))}</dd>
                  <dt>Dernière modification</dt>
                  <dd>{dateTimeFormatter.format(new Date(user.updatedAt))}</dd>
                  <dt>CGU acceptées</dt>
                  <dd>{user.termsAcceptedAt ? dateFormatter.format(new Date(user.termsAcceptedAt)) : "Non enregistré"}</dd>
                </dl>
              </Panel>

              <Panel title="Territoires">
                {user.territories.length === 0 ? (
                  <p className="admin-rows__empty">Aucun territoire.</p>
                ) : (
                  <ul className="admin-rows">
                    {user.territories.map((territory) => (
                      <li key={territory.code}>
                        <div className="admin-rows__item">
                          <div className="admin-rows__text">
                            <strong>
                              {territory.name} ({territory.code})
                            </strong>
                            <span>Rejoint le {dateFormatter.format(new Date(territory.joinedAt))}</span>
                          </div>
                          {territory.isDefault && <StatusBadge label="Principal" color="#2563eb" />}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Profil">
                <dl className="admin-facts">
                  <dt>Ce que je recherche</dt>
                  <dd>{user.lookingFor || "—"}</dd>
                  <dt>Ouvert à</dt>
                  <dd>{user.openTo || "—"}</dd>
                </dl>
                <h4 className="admin-user-detail__subtitle">Sports favoris</h4>
                {user.favoriteSports.length === 0 ? (
                  <p className="admin-rows__empty">Aucun sport favori.</p>
                ) : (
                  <div className="admin-tags">
                    {user.favoriteSports.map((sport) => (
                      <span key={sport}>{sport}</span>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Disponibilités">
                {user.availabilities.length === 0 ? (
                  <p className="admin-rows__empty">Aucun créneau renseigné.</p>
                ) : (
                  <div className="admin-tags">
                    {user.availabilities.map((slot) => (
                      <span key={`${slot.weekday}-${slot.startTime}`}>
                        {WEEKDAY_LABELS[slot.weekday] ?? slot.weekday} · {slot.startTime} – {slot.endTime}
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            <Panel title="Activités créées" subtitle={`${user.activitiesCreated.length} au total`}>
              {user.activitiesCreated.length === 0 ? (
                <p className="admin-rows__empty">Aucune activité créée.</p>
              ) : (
                <ul className="admin-rows">
                  {user.activitiesCreated.map((activity) => (
                    <li key={activity.id}>
                      <Link to={`/admin/activites/${activity.id}`} className="admin-rows__item">
                        <div className="admin-rows__text">
                          <strong>{activity.title}</strong>
                          <span>
                            {activity.sportName} · {activity.city} · {dateFormatter.format(new Date(activity.startDate))} ·{" "}
                            {activity.participantsCount}/{activity.maxParticipants} participants
                          </span>
                        </div>
                        <StatusBadge
                          label={ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
                          color={ACTIVITY_STATUS_COLORS[activity.status] ?? "#64748b"}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Participations" subtitle={`${user.participations.length} demande${user.participations.length > 1 ? "s" : ""}`}>
              {user.participations.length === 0 ? (
                <p className="admin-rows__empty">Aucune participation.</p>
              ) : (
                <ul className="admin-rows">
                  {user.participations.map((participation) => (
                    <li key={participation.activityId}>
                      <Link to={`/admin/activites/${participation.activityId}`} className="admin-rows__item">
                        <div className="admin-rows__text">
                          <strong>{participation.title}</strong>
                          <span>
                            {participation.sportName} · {dateFormatter.format(new Date(participation.startDate))} · activité{" "}
                            {(ACTIVITY_STATUS_LABELS[participation.activityStatus] ?? participation.activityStatus).toLowerCase()}
                          </span>
                        </div>
                        <StatusBadge
                          label={PARTICIPATION_STATUS_LABELS[participation.status] ?? participation.status}
                          color={PARTICIPATION_STATUS_COLORS[participation.status] ?? "#64748b"}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <button type="button" className="admin-danger-button" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={16} strokeWidth={2.2} />
              Supprimer ce compte
            </button>
          </>
        )}
      </div>
      <AdminBottomNav />

      <ConfirmDialog
        isOpen={confirmOpen}
        title={`Supprimer le compte de ${user?.pseudo ?? ""} ?`}
        description="Cette action est définitive : le compte et les données personnelles associées seront supprimés. Les activités créées par cet utilisateur resteront visibles pour les autres participants."
        isSubmitting={isDeleting}
        errorMessage={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
