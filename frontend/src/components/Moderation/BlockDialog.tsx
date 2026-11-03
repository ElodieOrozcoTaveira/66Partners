import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, X } from "lucide-react";
import { blockUser, moderationErrorMessage } from "../../api/moderation";
import "../ConfirmDialog/ConfirmDialog.scss";

interface BlockDialogProps {
  member: { userId: string; pseudo: string } | null;
  onClose: () => void;
  /** Après un blocage réussi (ex. quitter la page du membre). */
  onBlocked: () => void;
}

/** Confirmation de blocage : les deux membres deviennent invisibles l'un pour l'autre. */
export default function BlockDialog({ member, onClose, onBlocked }: BlockDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member) {
      setIsSubmitting(false);
      setError(null);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [member, onClose]);

  if (!member) return null;

  async function confirm() {
    if (!member) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await blockUser(member.userId);
      onBlocked();
    } catch (err) {
      setError(moderationErrorMessage(err, "Le blocage n'a pas pu aboutir. Réessaie dans un instant."));
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="confirm-dialog__close" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
        <span className="confirm-dialog__icon">
          <Ban size={22} strokeWidth={2.2} />
        </span>
        <h3 className="confirm-dialog__title">Bloquer {member.pseudo} ?</h3>
        <p className="confirm-dialog__description">
          Vous ne verrez plus vos profils, activités, messages et photos respectifs, et ses demandes en cours pour tes
          prochaines activités seront retirées. Il n'en sera pas informé. Tu pourras le débloquer depuis ton profil.
        </p>
        {error && <p className="confirm-dialog__error">{error}</p>}
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button type="button" className="confirm-dialog__confirm" onClick={() => void confirm()} disabled={isSubmitting}>
            {isSubmitting ? "Blocage..." : "Bloquer"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
