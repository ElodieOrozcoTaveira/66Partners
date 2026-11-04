import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, CheckCircle2, Link2, Unlink } from "lucide-react";
import {
  disconnectStrava,
  fetchStravaStatus,
  startStravaConnect,
  STRAVA_CALLBACK_ERRORS,
  stravaErrorMessage,
  type StravaStatus,
} from "../../../api/strava";
import { formatMonthYear } from "../../../lib/dateFormat";
import "./StravaCard.scss";

type Notice = { tone: "success" | "error"; text: string };

/** Mon profil : relier / délier son compte Strava. */
export default function StravaCard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStravaStatus()
      .then(setStatus)
      .catch(() => setNotice({ tone: "error", text: "Impossible de vérifier ta connexion Strava." }));
  }, []);

  useEffect(() => {
    const result = searchParams.get("strava");
    if (!result) return;
    const reason = searchParams.get("reason") ?? "";
    setNotice(
      result === "connected"
        ? { tone: "success", text: "Ton compte Strava est relié !" }
        : {
            tone: "error",
            text: STRAVA_CALLBACK_ERRORS[reason] ?? "La connexion à Strava n'a pas abouti. Réessaie.",
          },
    );
    const next = new URLSearchParams(searchParams);
    next.delete("strava");
    next.delete("reason");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  async function connect() {
    setBusy(true);
    setNotice(null);
    try {
      await startStravaConnect();
    } catch (error) {
      setNotice({ tone: "error", text: stravaErrorMessage(error, "Impossible de contacter Strava.") });
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Délier ton compte Strava ? Tu pourras le relier à nouveau à tout moment.")) return;
    setBusy(true);
    setNotice(null);
    try {
      await disconnectStrava();
      setStatus({ linked: false, linkedAt: null, athleteName: null, athleteAvatarUrl: null });
    } catch (error) {
      setNotice({ tone: "error", text: stravaErrorMessage(error, "Impossible de délier Strava.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="strava-card" aria-labelledby="strava-card-titre">
      <div className="strava-card__head">
        <span className="strava-card__logo" aria-hidden="true">
          <Activity size={20} strokeWidth={2.4} />
        </span>
        <div className="strava-card__heading">
          <h2 id="strava-card-titre">Strava</h2>
          <p>
            {status?.linked
              ? "Après une sortie, valide ta rencontre : ton activité Strava sera renommée avec tes partenaires."
              : "Relie Strava pour immortaliser tes rencontres directement sur tes activités."}
          </p>
        </div>
      </div>

      {notice && (
        <p className={`strava-card__notice strava-card__notice--${notice.tone}`} role="status">
          {notice.text}
        </p>
      )}

      {status === null ? null : status.linked ? (
        <div className="strava-card__row">
          <span className="strava-card__linked">
            {status.athleteAvatarUrl ? (
              <span className="strava-card__avatar">
                <img src={status.athleteAvatarUrl} alt="" referrerPolicy="no-referrer" />
                <CheckCircle2 size={14} strokeWidth={2.8} />
              </span>
            ) : (
              <CheckCircle2 size={16} strokeWidth={2.4} />
            )}
            <span>
              {status.athleteName ? (
                <>
                  Relié au compte Strava de <strong>{status.athleteName}</strong>
                </>
              ) : (
                "Relié"
              )}
              {status.linkedAt ? ` depuis ${formatMonthYear(new Date(status.linkedAt)).toLowerCase()}` : ""}
              <small className="strava-card__notyou">Ce n'est pas toi ? Délie puis relie ton propre compte.</small>
            </span>
          </span>
          <button type="button" className="strava-card__unlink" onClick={() => void disconnect()} disabled={busy}>
            <Unlink size={15} strokeWidth={2.2} />
            Délier
          </button>
        </div>
      ) : (
        <>
          <button type="button" className="strava-card__connect" onClick={() => void connect()} disabled={busy}>
            <Link2 size={17} strokeWidth={2.4} />
            {busy ? "Redirection..." : "Relier mon compte Strava"}
          </button>
          <p className="strava-card__hint">
            Strava relie le compte connecté sur cet appareil. Sur ordinateur, si quelqu'un d'autre est connecté
            sur strava.com, déconnecte-le d'abord. Sur téléphone, c'est le compte de ton app Strava.
          </p>
        </>
      )}
    </section>
  );
}
