import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Activity, CheckCircle2, LogOut } from "lucide-react";
import {
  disconnectStrava,
  fetchStravaStatus,
  startStravaConnect,
  STRAVA_CALLBACK_ERRORS,
  stravaErrorMessage,
  type StravaStatus,
} from "../../../api/strava";
import { formatMonthYear } from "../../../lib/dateFormat";
import ConfirmDialog from "../../ConfirmDialog/ConfirmDialog";
import { ConnectWithStrava, PoweredByStrava } from "../../StravaBrand/StravaBrand";
import "./StravaCard.scss";

type Notice = { tone: "success" | "error"; text: string };

/** Mon profil : relier / délier son compte Strava. */
export default function StravaCard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<StravaStatus | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

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
    setBusy(true);
    setDisconnectError(null);
    try {
      await disconnectStrava();
      setStatus({ linked: false, linkedAt: null, athleteName: null, athleteAvatarUrl: null });
      setConfirmOpen(false);
      setNotice({ tone: "success", text: "Strava est déconnecté de ton profil." });
    } catch (error) {
      setDisconnectError(stravaErrorMessage(error, "Impossible de déconnecter Strava. Réessaie."));
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
              <small className="strava-card__notyou">Ce n'est pas toi ? Déconnecte Strava puis relie ton propre compte.</small>
            </span>
          </span>
          <button type="button" className="strava-card__unlink" onClick={() => setConfirmOpen(true)} disabled={busy}>
            <LogOut size={16} strokeWidth={2.4} />
            {busy ? "Déconnexion..." : "Déconnecter Strava"}
          </button>
        </div>
      ) : (
        <>
          <ConnectWithStrava onClick={() => void connect()} disabled={busy} />
          <p className="strava-card__hint">
            Strava relie le compte connecté sur strava.com dans ce navigateur. Si quelqu'un d'autre y est
            connecté, déconnecte-le d'abord : l'écran Strava t'indique le compte avant d'accepter.
          </p>
          <p className="strava-card__privacy">
            En reliant Strava, tu autorises 66Partners à lire tes activités et à renommer celle d'une
            sortie, uniquement quand tu appuies sur « Valider notre rencontre ». Tes parcours et
            performances ne sont pas enregistrés, et tu peux déconnecter Strava à tout moment.{" "}
            <Link to="/confidentialite">En savoir plus</Link>
          </p>
        </>
      )}

      <div className="strava-card__powered">
        <PoweredByStrava />
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Déconnecter Strava ?"
        description={`${
          status?.athleteName ? `Le compte Strava de ${status.athleteName} ne sera plus relié à ton profil. ` : ""
        }66Partners n'aura plus accès à tes activités Strava. Tu pourras le reconnecter à tout moment.`}
        confirmWord={null}
        confirmLabel="Déconnecter Strava"
        submittingLabel="Déconnexion..."
        icon={<LogOut size={22} strokeWidth={2.2} />}
        isSubmitting={busy}
        errorMessage={disconnectError}
        onConfirm={() => void disconnect()}
        onCancel={() => {
          setConfirmOpen(false);
          setDisconnectError(null);
        }}
      />
    </section>
  );
}
