import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import {
  getAdminPushState,
  subscribeAdminToPush,
  unsubscribeAdminFromPush,
  type PushSupportState,
} from "../../../lib/webPush";
import "./AdminPushAlerts.scss";

interface AdminPushAlertsProps {
  onMessage: (message: string) => void;
}

/**
 * Alertes push admin sur CET appareil : une notification à chaque nouvelle
 * inscription et à chaque nouvelle activité. Activation uniquement sur clic (jamais automatique).
 * Sur iPhone, ne fonctionne que depuis le site installé sur l'écran d'accueil.
 */
export default function AdminPushAlerts({ onMessage }: AdminPushAlertsProps) {
  const [state, setState] = useState<PushSupportState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAdminPushState().then(setState);
  }, []);

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (state === "subscribed") {
        await unsubscribeAdminFromPush();
        setState("available");
        onMessage("Alertes désactivées sur cet appareil");
      } else {
        const ok = await subscribeAdminToPush();
        setState(ok ? "subscribed" : await getAdminPushState());
        onMessage(ok ? "Alertes activées sur cet appareil" : "Permission refusée");
      }
    } catch (err) {
      console.error("Alertes push admin:", err);
      onMessage("Impossible de modifier les alertes");
    } finally {
      setBusy(false);
    }
  }

  const description =
    state === "unsupported"
      ? "Non supporté ici. Sur iPhone : installe le site sur l'écran d'accueil puis ouvre l'admin depuis l'icône."
      : state === "denied"
        ? "Notifications bloquées : autorise-les dans les réglages du navigateur."
        : state === "error"
          ? "Service worker indisponible, recharge la page."
          : "Reçois une notification sur ce téléphone à chaque nouvelle inscription et nouvelle activité.";

  const canToggle = state === "available" || state === "subscribed";

  return (
    <section className="admin-push-alerts">
      <h2>Alertes sur cet appareil</h2>
      <div className="admin-push-alerts__card">
        <span className="admin-push-alerts__icon">
          <BellRing size={18} strokeWidth={2.2} />
        </span>
        <span className="admin-push-alerts__text">
          <span className="admin-push-alerts__label">Inscriptions et activités</span>
          <span className="admin-push-alerts__description">{description}</span>
        </span>
        {canToggle && (
          <button
            type="button"
            role="switch"
            aria-checked={state === "subscribed"}
            aria-label="Alertes nouvelles inscriptions et activités"
            className={`admin-push-alerts__switch${state === "subscribed" ? " is-on" : ""}`}
            onClick={handleToggle}
            disabled={busy}
          >
            <span />
          </button>
        )}
      </div>
    </section>
  );
}
