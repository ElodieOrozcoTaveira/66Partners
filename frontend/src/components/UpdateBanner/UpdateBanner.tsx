import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import "./UpdateBanner.scss";

/** Vérification des mises à jour au plus toutes les 30 minutes. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Bandeau « Nouvelle version disponible » : le service worker (skipWaiting +
 * clientsClaim) prend la main dès qu'une nouvelle version est téléchargée,
 * mais la page ouverte garde l'ancien code jusqu'au prochain chargement. On
 * propose alors de recharger, sans jamais le faire à la place du membre (un
 * message ou un formulaire peut être en cours).
 */
export default function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const container = navigator.serviceWorker;
    // Première visite : le service worker prend la main sans que rien n'ait changé.
    const hadController = Boolean(container.controller);

    const handleControllerChange = () => {
      if (hadController) setVisible(true);
    };
    container.addEventListener("controllerchange", handleControllerChange);

    let lastCheck = Date.now();
    const checkForUpdate = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastCheck < CHECK_INTERVAL_MS) return;
      lastCheck = Date.now();
      container
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", checkForUpdate);
    const timer = window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    return () => {
      container.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.clearInterval(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="update-banner" role="status">
      <span className="update-banner__icon" aria-hidden="true">
        <RefreshCw size={16} strokeWidth={2.6} />
      </span>
      <span className="update-banner__text">
        Nouvelle version<span className="update-banner__long"> disponible</span>
      </span>
      <button type="button" className="update-banner__reload" onClick={() => window.location.reload()}>
        Recharger
      </button>
      <button
        type="button"
        className="update-banner__close"
        onClick={() => setVisible(false)}
        aria-label="Plus tard"
      >
        <X size={16} strokeWidth={2.6} />
      </button>
    </div>
  );
}
