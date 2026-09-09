import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isAxiosError } from "axios";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/axios";
import {
  getPushSupportState,
  subscribeToPush,
  unsubscribeFromPush,
  type PushSupportState,
} from "../../../lib/webPush";
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
  const [headline, setHeadline] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [openTo, setOpenTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushSupportState | "checking">("checking");
  const [isPushBusy, setIsPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    getPushSupportState().then(setPushState);
  }, [isOpen]);

  async function handleTogglePush() {
    setIsPushBusy(true);
    setPushError(null);
    try {
      if (pushState === "subscribed") {
        await unsubscribeFromPush();
      } else {
        await subscribeToPush();
      }
      setPushState(await getPushSupportState());
    } catch (err) {
      // Ne jamais laisser le toggle retomber silencieusement à "off" sans
      // explication — l'utilisateur doit savoir que l'activation a échoué.
      console.error("Erreur lors de l'activation des notifications push:", err);
      setPushError("Impossible d'activer les notifications pour le moment. Réessaie plus tard.");
      setPushState(await getPushSupportState());
    } finally {
      setIsPushBusy(false);
    }
  }

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
      setPushError(null);
      return;
    }

    setPseudo(user?.pseudo ?? "");
    setCity(user?.city ?? "");
    setHeadline(user?.headline ?? "");
    setLookingFor(user?.lookingFor ?? "");
    setOpenTo(user?.openTo ?? "");
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
        headline: headline.trim() || null,
        lookingFor: lookingFor.trim() || null,
        openTo: openTo.trim() || null,
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
              htmlFor="edit-headline"
            >
              Ta présentation
            </label>
            <input
              id="edit-headline"
              type="text"
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              className="container-modaleEditProfil__input"
              placeholder="Ex. Passionné de sport et de nouvelles rencontres."
              maxLength={200}
            />

            <label
              className="container-modaleEditProfil__label"
              htmlFor="edit-lookingFor"
            >
              Ce que tu recherches
            </label>
            <input
              id="edit-lookingFor"
              type="text"
              value={lookingFor}
              onChange={(event) => setLookingFor(event.target.value)}
              className="container-modaleEditProfil__input"
              placeholder="Ex. Recherche des partenaires motivés et respectueux."
              maxLength={200}
            />

            <label
              className="container-modaleEditProfil__label"
              htmlFor="edit-openTo"
            >
              Ton ouverture d'esprit
            </label>
            <input
              id="edit-openTo"
              type="text"
              value={openTo}
              onChange={(event) => setOpenTo(event.target.value)}
              className="container-modaleEditProfil__input"
              placeholder="Ex. Ouvert à de nouveaux sports et défis."
              maxLength={200}
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

          {pushState !== "checking" && pushState !== "unsupported" && (
            <div className="container-modaleEditProfil__push">
              <div className="container-modaleEditProfil__pushText">
                <span className="container-modaleEditProfil__label">
                  Notifications push
                </span>
                <p className="container-modaleEditProfil__pushHint">
                  {pushState === "denied"
                    ? "Bloquées dans les réglages de ton navigateur : réactive-les depuis les paramètres du site pour les recevoir."
                    : pushState === "error"
                      ? "Indisponibles pour le moment sur cet appareil/navigateur."
                      : "Reçois une alerte sur ton téléphone même quand tu n'es pas sur le site."}
                </p>
                {pushError && (
                  <p className="container-modaleEditProfil__error">{pushError}</p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pushState === "subscribed"}
                className={
                  "container-modaleEditProfil__pushToggle" +
                  (pushState === "subscribed" ? " container-modaleEditProfil__pushToggle--on" : "")
                }
                onClick={handleTogglePush}
                disabled={isPushBusy || pushState === "denied" || pushState === "error"}
              >
                <span className="container-modaleEditProfil__pushToggleKnob" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
