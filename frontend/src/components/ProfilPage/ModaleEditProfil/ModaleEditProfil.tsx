import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isAxiosError } from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/axios";
import "./ModaleEditProfil.scss";

interface ModaleEditProfilProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModaleEditProfil({
  isOpen,
  onClose,
}: ModaleEditProfilProps) {
  const { user, refreshUser } = useAuth();
  const [pseudo, setPseudo] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [dispo, setDispo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSubmitting(false);
      return;
    }

    setPseudo(user?.pseudo ?? "");
    setCity(user?.city ?? "");
    setBio(user?.bio ?? "");
    setDispo(user?.dispo ?? "");
  }, [isOpen, user]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!pseudo.trim()) {
      setError("Le pseudo est requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch("/api/users/me", {
        pseudo: pseudo.trim(),
        city: city.trim() || null,
        bio: bio.trim() || null,
        dispo: dispo.trim() || null,
      });
      await refreshUser();
      onClose();
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible d'enregistrer le profil pour le moment.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="modale-editprofil-overlay" onClick={onClose}>
      <div
        className="modale-editprofil-content"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modale-editprofil-content__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="container-modaleEditProfil">
          <h3 className="container-modaleEditProfil__h3">
            Modifier mon profil
          </h3>

          <form
            className="container-modaleEditProfil__form"
            onSubmit={handleSubmit}
          >
            <label
              className="container-modaleEditProfil__label"
              htmlFor="edit-pseudo"
            >
              Nom
            </label>
            <input
              id="edit-pseudo"
              type="text"
              value={pseudo}
              onChange={(event) => setPseudo(event.target.value)}
              className="container-modaleEditProfil__input"
            />

            <label
              className="container-modaleEditProfil__label"
              htmlFor="edit-city"
            >
              Ville
            </label>
            <input
              id="edit-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="container-modaleEditProfil__input"
              placeholder="Ex. Perpignan"
            />

            <label
              className="container-modaleEditProfil__label"
              htmlFor="edit-bio"
            >
              À propos de moi
            </label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="container-modaleEditProfil__textarea"
              placeholder="Parle un peu de toi, de ton niveau et de ce que tu cherches"
              rows={3}
            />

            <label
              className="container-modaleEditProfil__label"
              htmlFor="edit-dispo"
            >
              Disponibilités
            </label>
            <textarea
              id="edit-dispo"
              value={dispo}
              onChange={(event) => setDispo(event.target.value)}
              className="container-modaleEditProfil__textarea"
              placeholder="Ex. Le week-end et en semaine après 18h"
              rows={3}
            />

            {error && (
              <p className="container-modaleEditProfil__error">{error}</p>
            )}

            <button
              type="submit"
              className="container-modaleEditProfil__submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
