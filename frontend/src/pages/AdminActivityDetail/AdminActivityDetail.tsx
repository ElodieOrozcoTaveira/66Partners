import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, Camera, Car, Clock, MessageCircle, Users } from "lucide-react";
import { fetchAdminActivity, type AdminActivityDetail as ActivityDetail } from "../../api/adminActivities";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import { MiniStat, Panel, StatusBadge } from "../../components/AdminComponents/AdminPanel/AdminPanel";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import {
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_STATUS_LABELS,
  PARTICIPATION_STATUS_COLORS,
  PARTICIPATION_STATUS_LABELS,
  dateFormatter,
  dateTimeFormatter,
  levelLabel,
} from "../../lib/adminLabels";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import "../../components/AdminComponents/AdminPanel/AdminPanel.scss";
import "./AdminActivityDetail.scss";
import { useTerritoryAvatar } from "../../hooks/useTerritoryAvatar";

type State =
  | { status: "loading" }
  | { status: "error"; notFound: boolean }
  | { status: "ready"; data: ActivityDetail };

/**
 * Fiche complète d'une activité : infos, organisateur, participants et
 * compteurs. Le contenu des messages n'est jamais affiché (confidentialité
 * des discussions), seulement leur nombre.
 */
export default function AdminActivityDetail() {
  const { activityId = "" } = useParams();
  const navigate = useNavigate();
  const territoryAvatar = useTerritoryAvatar();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminActivity(activityId)
      .then((data) => setState({ status: "ready", data }))
      .catch((err) =>
        setState({ status: "error", notFound: isAxiosError(err) && err.response?.status === 404 }),
      );
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  const activity = state.status === "ready" ? state.data : null;
  const visual = activity ? getSportVisual(activity.sportName) : null;
  const SportIcon = visual?.icon;

  return (
    <div className="admin-page">
      <div className="admin-page__body">
        <header className="admin-page__header">
          <button type="button" className="admin-page__back" onClick={() => navigate(-1)} aria-label="Retour">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <div>
            <h1>{activity ? activity.title : "Fiche activité"}</h1>
            <p>
              {activity
                ? `Créée le ${dateFormatter.format(new Date(activity.createdAt))} · ${activity.territory.name}`
                : "Chargement…"}
            </p>
          </div>
        </header>

        {state.status === "error" && (
          <div className="admin-panel">
            {state.notFound ? (
              <p className="admin-rows__empty">
                Cette activité n'existe plus. <Link to="/admin/activites">Retour à la liste</Link>
              </p>
            ) : (
              <ErrorBlock message="Impossible de charger cette fiche." onRetry={load} />
            )}
          </div>
        )}

        {state.status === "loading" && (
          <div className="admin-panel">
            <Skeleton width="60%" height="1.1rem" />
            <Skeleton width="80%" height="0.8rem" className="admin-activity-detail__gap" />
            <Skeleton width="40%" height="0.8rem" className="admin-activity-detail__gap" />
          </div>
        )}

        {activity && visual && SportIcon && (
          <>
            <div className="admin-panel admin-activity-detail__hero">
              <span
                className="admin-activity-detail__sport"
                style={{ backgroundColor: visual.color, color: getIconColor(visual.color) }}
              >
                <SportIcon size={22} strokeWidth={2.2} />
              </span>
              <div className="admin-activity-detail__hero-text">
                <span className="admin-activity-detail__sport-name">{activity.sportName}</span>
                <strong>{dateTimeFormatter.format(new Date(activity.startDate))}</strong>
                <span>{activity.city}</span>
              </div>
              <StatusBadge
                label={ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
                color={ACTIVITY_STATUS_COLORS[activity.status] ?? "#64748b"}
              />
            </div>

            <div className="admin-page__grid admin-page__grid--4">
              <MiniStat
                icon={Users}
                label="Participants"
                value={activity.counts.accepted}
                suffix={`/${activity.maxParticipants}`}
              />
              <MiniStat icon={Clock} label="En attente" value={activity.counts.pending} hint={`${activity.counts.refused} refusée(s)`} />
              <MiniStat
                icon={MessageCircle}
                label="Messages"
                value={activity.counts.messages}
                hint={
                  activity.lastMessageAt
                    ? `Dernier le ${dateFormatter.format(new Date(activity.lastMessageAt))}`
                    : `${activity.counts.conversations} discussion(s)`
                }
              />
              <MiniStat icon={Camera} label="Photos" value={activity.counts.photos} />
            </div>

            <div className="admin-page__two-cols">
              <Panel title="Informations">
                <dl className="admin-facts">
                  <dt>Organisateur</dt>
                  <dd>
                    {activity.creator ? (
                      <Link to={`/admin/utilisateurs/${activity.creator.id}`}>{activity.creator.pseudo}</Link>
                    ) : (
                      "Compte supprimé"
                    )}
                  </dd>
                  <dt>Niveau</dt>
                  <dd>{levelLabel(activity.levelRequired)}</dd>
                  <dt>Places</dt>
                  <dd>{activity.maxParticipants}</dd>
                  <dt>Covoiturage</dt>
                  <dd>
                    {activity.carpoolEnabled ? (
                      <span className="admin-activity-detail__inline">
                        <Car size={14} strokeWidth={2.2} /> Proposé
                      </span>
                    ) : (
                      "Non"
                    )}
                  </dd>
                  <dt>Territoire</dt>
                  <dd>
                    {activity.territory.name} ({activity.territory.code})
                  </dd>
                  <dt>Dernière modification</dt>
                  <dd>{dateTimeFormatter.format(new Date(activity.updatedAt))}</dd>
                  {activity.latitude != null && activity.longitude != null && (
                    <>
                      <dt>Position</dt>
                      <dd>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${activity.latitude}&mlon=${activity.longitude}#map=14/${activity.latitude}/${activity.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Voir sur la carte
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </Panel>

              <Panel title="Description">
                <p className="admin-activity-detail__description">
                  {activity.description?.trim() || "Aucune description."}
                </p>
              </Panel>
            </div>

            <Panel
              title="Participants"
              subtitle={`${activity.participants.length} demande${activity.participants.length > 1 ? "s" : ""} au total`}
            >
              {activity.participants.length === 0 ? (
                <p className="admin-rows__empty">Aucune demande de participation.</p>
              ) : (
                <ul className="admin-rows">
                  {activity.participants.map((participant) => (
                    <li key={participant.userId}>
                      <Link to={`/admin/utilisateurs/${participant.userId}`} className="admin-rows__item">
                        <img src={participant.avatar || territoryAvatar(participant.defaultTerritory)} alt="" className="admin-rows__avatar" />
                        <div className="admin-rows__text">
                          <strong>{participant.pseudo}</strong>
                          <span>
                            Demande le {dateFormatter.format(new Date(participant.createdAt))}
                            {participant.carpoolRequested ? " · souhaite covoiturer" : ""}
                          </span>
                        </div>
                        <StatusBadge
                          label={PARTICIPATION_STATUS_LABELS[participant.status] ?? participant.status}
                          color={PARTICIPATION_STATUS_COLORS[participant.status] ?? "#64748b"}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        )}
      </div>
      <AdminBottomNav />
    </div>
  );
}
