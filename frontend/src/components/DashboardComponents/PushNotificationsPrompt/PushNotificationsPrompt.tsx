import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getPushSupportState, subscribeToPush, type PushSupportState } from "../../../lib/webPush";
import "./PushNotificationsPrompt.scss";

const DISMISS_KEY = "66partners-push-prompt-dismissed-until";
const DISMISS_DAYS = 14;

function isDismissedForNow(): boolean {
  const until = localStorage.getItem(DISMISS_KEY);
  return until !== null && Date.now() < Number(until);
}

// Bandeau de consentement RGPD/CNIL pour les notifications push : rien ne se
// déclenche tant que l'utilisateur n'a pas cliqué explicitement sur
// "Activer" (pas de demande de permission navigateur au chargement).
export default function PushNotificationsPrompt() {
  const [state, setState] = useState<PushSupportState | "checking">("checking");
  const [isBusy, setIsBusy] = useState(false);
  const [isDismissed, setIsDismissed] = useState(isDismissedForNow);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPushSupportState().then(setState);
  }, []);

  function dismiss() {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
  }

  async function handleActivate() {
    setIsBusy(true);
    setError(null);
    try {
      await subscribeToPush();
      setState(await getPushSupportState());
    } catch (err) {
      // Jamais d'échec silencieux : sans ça, le bandeau reste affiché avec
      // un bouton "Activer" qui semble ne rien faire.
      console.error("Erreur lors de l'activation des notifications push:", err);
      setError("Impossible d'activer les notifications pour le moment. Réessaie plus tard.");
      setState(await getPushSupportState());
    } finally {
      setIsBusy(false);
    }
  }

  // "error" reste affiché (contrairement aux autres états non éligibles) —
  // sinon le message d'échec disparaîtrait avec le bandeau lui-même.
  const canOffer = state === "available" || state === "error";
  if (!canOffer || isDismissed) return null;

  return (
    <div className="push-prompt">
      <span className="push-prompt__icon">
        <Bell size={18} strokeWidth={2.2} />
      </span>
      <p className="push-prompt__text">
        {state === "error"
          ? "Les notifications ne sont pas disponibles pour le moment sur cet appareil/navigateur."
          : "Active les notifications pour être prévenu même quand tu n'es pas sur le site (nouveau message, activité confirmée...)."}
      </p>
      {error && <p className="push-prompt__error">{error}</p>}
      <div className="push-prompt__actions">
        <button
          type="button"
          className="push-prompt__btn push-prompt__btn--primary"
          onClick={handleActivate}
          disabled={isBusy || state === "error"}
        >
          Activer
        </button>
        <button type="button" className="push-prompt__btn" onClick={dismiss} disabled={isBusy}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
