import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, X } from "lucide-react";
import "./ConfirmDialog.scss";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  /** Mot exact à saisir pour activer la confirmation ; null : simple confirmation. */
  confirmWord?: string | null;
  confirmLabel?: string;
  /** Texte du bouton pendant l'action (par défaut « Suppression... »). */
  submittingLabel?: string;
  /** Icône en tête de la modale (par défaut, un triangle d'alerte). */
  icon?: ReactNode;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// Modale de confirmation réutilisable pour les actions destructives —
// aucun équivalent n'existait dans l'app avant le chantier suppression de
// compte (la déconnexion, par ex., agit sans confirmation). Saisie du mot
// exact requise avant d'activer la confirmation, pour une action aussi
// irréversible qu'une suppression de compte.
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmWord = "SUPPRIMER",
  confirmLabel = "Supprimer définitivement",
  submittingLabel = "Suppression...",
  icon,
  isSubmitting = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedWord, setTypedWord] = useState("");

  useEffect(() => {
    if (!isOpen) setTypedWord("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const canConfirm = (confirmWord === null || typedWord === confirmWord) && !isSubmitting;

  return createPortal(
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="confirm-dialog__close"
          onClick={onCancel}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <span className="confirm-dialog__icon">
          {icon ?? <TriangleAlert size={22} strokeWidth={2.2} />}
        </span>

        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__description">{description}</p>

        {confirmWord !== null && (
          <>
            <label className="confirm-dialog__label" htmlFor="confirm-dialog-input">
              Pour confirmer, saisis <strong>{confirmWord}</strong> ci-dessous :
            </label>
            <input
              id="confirm-dialog-input"
              type="text"
              className="confirm-dialog__input"
              value={typedWord}
              onChange={(event) => setTypedWord(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </>
        )}

        {errorMessage && <p className="confirm-dialog__error">{errorMessage}</p>}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="button"
            className="confirm-dialog__confirm"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {isSubmitting ? submittingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
