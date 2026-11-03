import { useState } from "react";
import { Ban, Flag } from "lucide-react";
import type { ReportTarget } from "../../api/moderation";
import BlockDialog from "./BlockDialog";
import ReportDialog from "./ReportDialog";
import "./Moderation.scss";

interface ModerationCardProps {
  /** Ce qui est signalé (le profil ou l'activité affichés). */
  report: ReportTarget & { label: string };
  /** Membre à bloquer (absent si compte supprimé). */
  block?: { userId: string; pseudo: string };
  onBlocked: () => void;
}

/** Encadré discret "Signaler / Bloquer" en bas d'un profil ou d'une activité. */
export default function ModerationCard({ report, block, onBlocked }: ModerationCardProps) {
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ userId: string; pseudo: string } | null>(null);

  return (
    <div className="moderation-card">
      <p>Un problème avec ce contenu ou ce membre ?</p>
      <div className="moderation-card__actions">
        <button
          type="button"
          className="moderation-card__button"
          onClick={() => setReportTarget({ context: report.context, targetId: report.targetId })}
        >
          <Flag size={15} strokeWidth={2.2} /> {report.label}
        </button>
        {block && (
          <button
            type="button"
            className="moderation-card__button moderation-card__button--danger"
            onClick={() => setBlockTarget(block)}
          >
            <Ban size={15} strokeWidth={2.2} /> Bloquer {block.pseudo}
          </button>
        )}
      </div>
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
      <BlockDialog member={blockTarget} onClose={() => setBlockTarget(null)} onBlocked={onBlocked} />
    </div>
  );
}
