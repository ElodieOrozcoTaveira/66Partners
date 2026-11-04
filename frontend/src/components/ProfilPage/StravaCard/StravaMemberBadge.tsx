import { useEffect, useState } from "react";
import { fetchMemberStravaLinked } from "../../../api/strava";
import { StravaLogo } from "../../StravaMeeting/StravaRouteLink";
import "./StravaMemberBadge.scss";

/** Profil d'un autre membre : pastille « Connecté à Strava » s'il l'est. */
export default function StravaMemberBadge({ userId }: { userId: string }) {
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLinked(false);
    fetchMemberStravaLinked(userId)
      .then((value) => {
        if (!cancelled) setLinked(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!linked) return null;

  return (
    <span className="strava-member-badge">
      <StravaLogo size={13} />
      Connecté à Strava
    </span>
  );
}
