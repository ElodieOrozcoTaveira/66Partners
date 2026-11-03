import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, X } from "lucide-react";
import {
  REPORT_REASONS,
  moderationErrorMessage,
  reportContent,
  type ReportReason,
  type ReportTarget,
} from "../../api/moderation";
import "../ConfirmDialog/ConfirmDialog.scss";
import "./Moderation.scss";

const TITLES: Record<ReportTarget["context"], string> = {
  PROFILE: "Signaler ce membre",
  MESSAGE: "Signaler ce message",
  ACTIVITY: "Signaler cette activité",
  PHOTO: "Signaler cette photo",
};

/**
 * Formulaire de signalement (même contenu que l'app mobile). L'équipe est
 * prévenue ; le membre signalé n'en est pas informé.
 */
export default function ReportDialog({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) return;
    setReason(null);
    setDetails("");
    setStatus("idle");
    setError(null);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [target, onClose]);

  if (!target) return null;

  async function submit() {
    if (!target || !reason) return;
    setStatus("sending");
    setError(null);
    try {
      await reportContent(target, reason, details);
      setStatus("sent");
    } catch (err) {
      setError(moderationErrorMessage(err, "Ton signalement n'a pas pu être envoyé."));
      setStatus("idle");
    }
  }

  return createPortal(
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog report-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="confirm-dialog__close" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
        <span className="confirm-dialog__icon">
          <Flag size={22} strokeWidth={2.2} />
        </span>

        {status === "sent" ? (
          <>
            <h3 className="confirm-dialog__title">Merci pour ton signalement</h3>
            <p className="confirm-dialog__description">
              L'équipe va l'examiner rapidement. Le membre concerné n'en est pas informé.
            </p>
            <div className="confirm-dialog__actions">
              <button type="button" className="confirm-dialog__confirm" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="confirm-dialog__title">{TITLES[target.context]}</h3>
            <p className="confirm-dialog__description">Pourquoi signales-tu ce contenu ?</p>
            <div className="report-dialog__reasons" role="radiogroup">
              {REPORT_REASONS.map((option) => (
                <label
                  key={option.value}
                  className={`report-dialog__reason${reason === option.value ? " report-dialog__reason--active" : ""}`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={() => setReason(option.value)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </label>
              ))}
            </div>
            <label className="confirm-dialog__label" htmlFor="report-details">
              Précisions (facultatif)
            </label>
            <textarea
              id="report-details"
              className="confirm-dialog__input report-dialog__details"
              value={details}
              maxLength={1000}
              rows={3}
              placeholder="Ce qui s'est passé, quand…"
              onChange={(e) => setDetails(e.target.value)}
            />
            {error && <p className="confirm-dialog__error">{error}</p>}
            <div className="confirm-dialog__actions">
              <button type="button" className="confirm-dialog__cancel" onClick={onClose} disabled={status === "sending"}>
                Annuler
              </button>
              <button
                type="button"
                className="confirm-dialog__confirm"
                onClick={() => void submit()}
                disabled={!reason || status === "sending"}
              >
                {status === "sending" ? "Envoi..." : "Envoyer"}
              </button>
            </div>
            <p className="report-dialog__footnote">En cas de danger immédiat, contacte le 17 (police) ou le 112.</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
