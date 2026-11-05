import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchMeetingValidation, STRAVA_VALIDATED_EVENT } from "../../api/strava";
import "./StravaRouteLink.scss";

/**
 * Pastille « View on Strava » (texte imposé par Strava) sur la page d'une sortie : visible seulement si
 * le membre a validé la rencontre avec Strava.
 */
export default function StravaRouteLink({ activityId }: { activityId: string }) {
  const [stravaUrl, setStravaUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMeetingValidation(activityId)
      .then((validation) => {
        if (!cancelled) setStravaUrl(validation.stravaUrl);
      })
      .catch(() => undefined);

    function handleValidated(event: Event) {
      const detail = (event as CustomEvent<{ activityId: string; stravaUrl: string }>).detail;
      if (detail?.activityId === activityId) setStravaUrl(detail.stravaUrl);
    }
    window.addEventListener(STRAVA_VALIDATED_EVENT, handleValidated);
    return () => {
      cancelled = true;
      window.removeEventListener(STRAVA_VALIDATED_EVENT, handleValidated);
    };
  }, [activityId]);

  if (!stravaUrl) return null;

  return (
    <a
      className="strava-route-link"
      href={stravaUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Mon parcours sur Strava"
    >
      View on Strava
      <ExternalLink size={12} strokeWidth={2.6} aria-hidden="true" />
    </a>
  );
}
