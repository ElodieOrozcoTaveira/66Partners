import { useEffect, useState } from "react";
import { fetchMeetingValidation, STRAVA_VALIDATED_EVENT } from "../../api/strava";
import "./StravaRouteLink.scss";

/** Logo Strava (simple-icons, CC0), utilisé pour renvoyer vers Strava. */
export function StravaLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

/**
 * Pastille « Mon parcours » sur la page d'une sortie : visible seulement si
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
      title="Voir mon parcours sur Strava"
    >
      <StravaLogo />
      Mon parcours
    </a>
  );
}
