import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PartyPopper, X } from "lucide-react";
import { isAxiosError } from "axios";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/axios";
import "./ModaleBienvenue.scss";

interface ModaleBienvenueProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModaleBienvenue({
  isOpen,
  onClose,
}: ModaleBienvenueProps) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<"welcome" | "profile">("welcome");
  const [pseudo, setPseudo] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
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
      setStep("welcome");
      setPseudo("");
      setCity("");
      setBio("");
      setError(null);
      setIsSubmitting(false);
      return;
    }

    if (user?.pseudo) {
      setPseudo(user.pseudo);
    }
  }, [isOpen, user?.pseudo]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!pseudo.trim() || !city.trim() || !bio.trim()) {
      setError("Tous les champs sont requis pour accéder à ton profil.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch("/api/users/me", {
        pseudo: pseudo.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
      await refreshUser();
      onClose();
      navigate("/profile");
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de mettre à jour le profil pour le moment.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="modale-bienvenue-overlay" onClick={onClose}>
      <div
        className="modale-bienvenue-content"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modale-bienvenue-content__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {step === "welcome" ? (
          <div className="container-modaleBienvenue">
            <h3 className="container-modaleBienvenue__h3">
              Bienvenue sur 66Partners <PartyPopper size={18} color="#F4B400" />
            </h3>
            <h4 className="container-modaleBienvenue__h4">
              Ton compte est prêt ! Établis ton profil et crée tes premières
              activités pour rencontrer d'autres sportifs près de chez toi.
            </h4>

            <div className="container-modaleBienvenue__actions">
              <button
                type="button"
                className="container-modaleBienvenue__submit"
                onClick={() => setStep("profile")}
              >
                Compléter mon profil
              </button>
              <button
                type="button"
                className="container-modaleBienvenue__later"
                onClick={onClose}
              >
                Plus tard
              </button>
            </div>
          </div>
        ) : (
          <div className="container-modaleBienvenue container-modaleBienvenue--form">
            <h3 className="container-modaleBienvenue__h3">
              Complétons ton profil
            </h3>
            <h4 className="container-modaleBienvenue__h4">
              Renseigne ton nom, ta ville et quelques mots à propos de toi pour
              découvrir les sportifs autour de chez toi.
            </h4>

            <form
              className="container-modaleBienvenue__form"
              onSubmit={handleSubmit}
            >
              <label
                className="container-modaleBienvenue__label"
                htmlFor="profile-pseudo"
              >
                Nom
              </label>
              <input
                id="profile-pseudo"
                type="text"
                value={pseudo}
                onChange={(event) => setPseudo(event.target.value)}
                className="container-modaleBienvenue__input"
                placeholder="Ton nom ou pseudo"
              />

              <label
                className="container-modaleBienvenue__label"
                htmlFor="profile-city"
              >
                Ville
              </label>
              <input
                id="profile-city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="container-modaleBienvenue__input"
                placeholder="Ex. Perpignan"
              />

              <label
                className="container-modaleBienvenue__label"
                htmlFor="profile-bio"
              >
                À propos de moi
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="container-modaleBienvenue__textarea"
                placeholder="Parle un peu de toi, de ton niveau et de ce que tu cherches"
                rows={4}
              />

              {error && (
                <p className="container-modaleBienvenue__error">{error}</p>
              )}

              <div className="container-modaleBienvenue__actions">
                <button
                  type="submit"
                  className="container-modaleBienvenue__submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enregistrement..." : "Accéder à mon profil"}
                </button>
                <button
                  type="button"
                  className="container-modaleBienvenue__later"
                  onClick={() => setStep("welcome")}
                >
                  Retour
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
