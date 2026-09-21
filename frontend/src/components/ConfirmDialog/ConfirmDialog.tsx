import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, X } from "lucide-react";
import "./ConfirmDialog.scss";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  /** Mot exact que l'utilisateur doit saisir pour activer le bouton de confirmation. */
  confirmWord?: string;
  confirmLabel?: string;
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

  const canConfirm = typedWord === confirmWord && !isSubmitting;

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
          <TriangleAlert size={22} strokeWidth={2.2} />
        </span>

        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__description">{description}</p>

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
            {isSubmitting ? "Suppression..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
