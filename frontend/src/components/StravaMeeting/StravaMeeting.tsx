import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Handshake, Link2 } from "lucide-react";
import { StravaLogo } from "./StravaRouteLink";
import {
  fetchMeetingValidation,
  fetchStravaStatus,
  startStravaConnect,
  stravaErrorCode,
  stravaErrorMessage,
  STRAVA_VALIDATED_EVENT,
  validateMeeting,
} from "../../api/strava";
import "./StravaMeeting.scss";

type State =
  | { kind: "loading" }
  | { kind: "unlinked" }
  | { kind: "ready" }
  | { kind: "validated"; stravaUrl: string; name: string | null }
  | { kind: "hidden" };

/** Page d'une sortie passée : « Valider notre rencontre » sur Strava. */
export default function StravaMeeting({ activityId }: { activityId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchStravaStatus(), fetchMeetingValidation(activityId)])
      .then(([status, validation]) => {
        if (cancelled) return;
        if (validation.validated && validation.stravaUrl) {
          setState({ kind: "validated", stravaUrl: validation.stravaUrl, name: null });
        } else {
          setState({ kind: status.linked ? "ready" : "unlinked" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "hidden" });
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      await startStravaConnect();
    } catch (err) {
      setError(stravaErrorMessage(err, "Impossible de contacter Strava."));
      setBusy(false);
    }
  }

  async function validate() {
    setBusy(true);
    setError(null);
    setNeedsReconnect(false);
    try {
      const result = await validateMeeting(activityId);
      setState({ kind: "validated", stravaUrl: result.stravaUrl, name: result.name });
      window.dispatchEvent(
        new CustomEvent(STRAVA_VALIDATED_EVENT, { detail: { activityId, stravaUrl: result.stravaUrl } }),
      );
    } catch (err) {
      const code = stravaErrorCode(err);
      if (code === "STRAVA_NOT_LINKED") {
        setState({ kind: "unlinked" });
      } else {
        setNeedsReconnect(code === "STRAVA_UNAUTHORIZED");
        setError(stravaErrorMessage(err, "La validation n'a pas pu aboutir. Réessaie."));
      }
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "loading" || state.kind === "hidden") return null;

  return (
    <section className="strava-meeting" aria-labelledby="strava-meeting-titre">
      <div className="strava-meeting__head">
        <span className="strava-meeting__icon" aria-hidden="true">
          {state.kind === "validated" ? (
            <CheckCircle2 size={20} strokeWidth={2.4} />
          ) : (
            <Handshake size={20} strokeWidth={2.4} />
          )}
        </span>
        <div>
          <h2 id="strava-meeting-titre">
            {state.kind === "validated" ? "Rencontre validée" : "Valider notre rencontre"}
          </h2>
          <p>
            {state.kind === "validated"
              ? state.name
                ? `Ton activité Strava s'appelle désormais « ${state.name} ».`
                : "Ton activité Strava porte la trace de cette rencontre."
              : state.kind === "unlinked"
                ? "Relie ton compte Strava : ton activité de cette sortie sera renommée avec tes partenaires."
                : "On retrouve ton activité Strava de cette sortie et on y ajoute tes partenaires."}
          </p>
        </div>
      </div>

      {error && (
        <p className="strava-meeting__error" role="alert">
          {error}
        </p>
      )}

      {state.kind === "validated" ? (
        <a className="strava-meeting__link" href={state.stravaUrl} target="_blank" rel="noopener noreferrer">
          <StravaLogo size={16} />
          Voir sur Strava
          <ExternalLink size={14} strokeWidth={2.2} />
        </a>
      ) : state.kind === "unlinked" || needsReconnect ? (
        <button type="button" className="strava-meeting__button" onClick={() => void connect()} disabled={busy}>
          <Link2 size={17} strokeWidth={2.4} />
          {busy ? "Redirection..." : needsReconnect ? "Reconnecter Strava" : "Relier mon compte Strava"}
        </button>
      ) : (
        <button type="button" className="strava-meeting__button" onClick={() => void validate()} disabled={busy}>
          <Handshake size={17} strokeWidth={2.4} />
          {busy ? "Validation..." : "Valider notre rencontre"}
        </button>
      )}
    </section>
  );
}
