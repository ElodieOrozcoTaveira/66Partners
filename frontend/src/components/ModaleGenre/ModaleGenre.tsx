import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  AUDIENCE_LABELS,
  GENDER_EXPLANATION,
  GENDER_LABELS,
  type ActivityAudience,
  type Gender,
} from "../../lib/audience";
import "./ModaleGenre.scss";

interface ModaleGenreProps {
  isOpen: boolean;
  audience: Exclude<ActivityAudience, "ALL">;
  onClose: () => void;
  /** Genre enregistré : l'appelant relance son action (rejoindre, publier). */
  onSaved: (gender: Gender) => void;
}

/**
 * Demande le genre au moment où il devient nécessaire (activité réservée),
 * jamais avant. Enregistré via PATCH /api/users/me, modifiable ensuite dans
 * « Modifier mon profil ».
 */
export default function ModaleGenre({ isOpen, audience, onClose, onSaved }: ModaleGenreProps) {
  const { refreshUser } = useAuth();
  const [choice, setChoice] = useState<Gender | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!choice) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.patch("/api/users/me", { gender: choice });
      await refreshUser();
      onSaved(choice);
    } catch (err) {
      setError(
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible d'enregistrer. Réessaie."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return createPortal(
    <div className="modale-genre-overlay" onClick={onClose}>
      <div
        className="modale-genre"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modale-genre-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modale-genre__close" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>
        <h3 id="modale-genre-title" className="modale-genre__title">
          Activité « {AUDIENCE_LABELS[audience].toLowerCase()} »
        </h3>
        <p className="modale-genre__text">Pour continuer, indique ton genre.</p>
        <p className="modale-genre__hint">{GENDER_EXPLANATION}</p>

        <div className="modale-genre__options" role="radiogroup">
          {(Object.keys(GENDER_LABELS) as Gender[]).map((gender) => (
            <label
              key={gender}
              className={`modale-genre__option${choice === gender ? " modale-genre__option--active" : ""}`}
            >
              <input
                type="radio"
                name="modale-genre"
                value={gender}
                checked={choice === gender}
                onChange={() => setChoice(gender)}
              />
              {GENDER_LABELS[gender]}
            </label>
          ))}
        </div>

        {error && <p className="modale-genre__error">{error}</p>}

        <button
          type="button"
          className="modale-genre__submit"
          onClick={handleSave}
          disabled={!choice || isSaving}
        >
          {isSaving ? "Enregistrement..." : "Enregistrer et continuer"}
        </button>
      </div>
    </div>,
    document.body
  );
}
