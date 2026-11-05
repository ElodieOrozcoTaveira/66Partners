import { useCallback, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  fetchAdminReports,
  updateAdminReport,
  type AdminReport,
  type AdminReportStatus,
} from "../../api/adminUsers";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import { StatusBadge } from "../../components/AdminComponents/AdminPanel/AdminPanel";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import { REPORT_CONTEXT_LABELS, REPORT_REASON_LABELS, dateTimeFormatter } from "../../lib/adminLabels";
import "../../components/AdminComponents/AdminPanel/AdminPanel.scss";
import "./AdminReports.scss";
import { useTerritoryAvatar } from "../../hooks/useTerritoryAvatar";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: AdminReport[] };

const STATUS_OPTIONS: { value: AdminReportStatus; label: string }[] = [
  { value: "OPEN", label: "À traiter" },
  { value: "RESOLVED", label: "Traités" },
];

/**
 * Signalements des membres (profils, messages, activités, photos). Les
 * stores demandent de les traiter rapidement ; supprimer un compte se fait
 * depuis sa fiche membre.
 */
export default function AdminReports() {
  const territoryAvatar = useTerritoryAvatar();
  const [filter, setFilter] = useState<AdminReportStatus>("OPEN");
  const [state, setState] = useState<State>({ status: "loading" });
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchAdminReports(filter)
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(report: AdminReport) {
    setPending(report.id);
    setActionError(null);
    try {
      await updateAdminReport(report.id, report.status === "OPEN" ? "RESOLVED" : "OPEN");
      // Il change d'onglet : retiré de la liste affichée.
      setState((current) =>
        current.status === "ready" ? { status: "ready", data: current.data.filter((r) => r.id !== report.id) } : current,
      );
    } catch {
      setActionError("Impossible de mettre à jour ce signalement.");
    } finally {
      setPending(null);
    }
  }

  const count = state.status === "ready" ? state.data.length : 0;

  return (
    <div className="admin-page">
      <div className="admin-page__body">
        <header className="admin-page__header">
          <NavLink to="/admin/stats" className="admin-page__back" aria-label="Retour aux statistiques">
            <ArrowLeft size={18} strokeWidth={2.2} />
          </NavLink>
          <div>
            <h1>Signalements</h1>
            <p>
              {state.status === "ready"
                ? `${count} signalement${count > 1 ? "s" : ""} ${filter === "OPEN" ? "à traiter" : `traité${count > 1 ? "s" : ""}`}`
                : "Contenus et membres signalés par la communauté"}
            </p>
          </div>
        </header>

        <div className="admin-chips" role="group" aria-label="Filtrer par statut">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="admin-chip"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {actionError && <p className="admin-reports__error">{actionError}</p>}

        {state.status === "error" && (
          <div className="admin-panel">
            <ErrorBlock message="Impossible de charger les signalements." onRetry={load} />
          </div>
        )}

        {state.status === "loading" && (
          <div className="admin-panel">
            <Skeleton width="50%" height="1rem" />
            <Skeleton width="80%" height="0.8rem" />
          </div>
        )}

        {state.status === "ready" && state.data.length === 0 && (
          <div className="admin-panel">
            <p className="admin-rows__empty">
              {filter === "OPEN" ? "Aucun signalement à traiter." : "Aucun signalement traité."}
            </p>
          </div>
        )}

        {state.status === "ready" &&
          state.data.map((report) => (
            <article key={report.id} className="admin-panel admin-report">
              <div className="admin-report__head">
                <StatusBadge label={REPORT_REASON_LABELS[report.reason] ?? report.reason} color="#c62828" />
                <span className="admin-report__context">{REPORT_CONTEXT_LABELS[report.context] ?? report.context}</span>
              </div>

              {report.reportedUser ? (
                <Link to={`/admin/utilisateurs/${report.reportedUser.id}`} className="admin-rows__item">
                  <img src={report.reportedUser.avatar || territoryAvatar(report.reportedUser.defaultTerritory)} alt="" className="admin-rows__avatar" />
                  <div className="admin-rows__text">
                    <strong>{report.reportedUser.pseudo}</strong>
                    <span>
                      {report.reportedUser.openReports} signalement{report.reportedUser.openReports > 1 ? "s" : ""} en attente
                    </span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <p className="admin-report__meta">Membre signalé : compte supprimé</p>
              )}

              {report.targetExcerpt && <blockquote className="admin-report__excerpt">{report.targetExcerpt}</blockquote>}
              {report.photoUrl && <img src={report.photoUrl} alt="Photo signalée" className="admin-report__photo" />}
              {report.details && <p className="admin-report__details">« {report.details} »</p>}

              <p className="admin-report__meta">
                Par {report.reporter?.pseudo ?? "compte supprimé"} · {dateTimeFormatter.format(new Date(report.createdAt))}
                {report.resolvedAt && ` · traité le ${dateTimeFormatter.format(new Date(report.resolvedAt))}`}
              </p>

              <button
                type="button"
                className={`admin-report__action${report.status === "OPEN" ? " admin-report__action--primary" : ""}`}
                onClick={() => void toggle(report)}
                disabled={pending !== null}
              >
                {pending === report.id ? "..." : report.status === "OPEN" ? "Marquer comme traité" : "Rouvrir"}
              </button>
            </article>
          ))}
      </div>
      <AdminBottomNav />
    </div>
  );
}
