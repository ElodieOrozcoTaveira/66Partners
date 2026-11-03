import { useEffect, useRef, useState } from "react";

import { distanceKm, type Coordinates } from "../lib/geo";
import { shareLocationAndCount, type NearbyCount } from "../services/nearby.service";

/**
 * Nombre de sportifs autour de la position donnée (cf. POST /nearby). On ne
 * redemande que si l'on a bougé d'au moins 1 km (la position arrive souvent
 * deux fois : récente, puis fraîche).
 */
export function useNearbyCount(coords: Coordinates | null): NearbyCount | null {
  const [nearby, setNearby] = useState<NearbyCount | null>(null);
  const lastSent = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!coords) return;
    if (lastSent.current && distanceKm(lastSent.current, coords) < 1) return;
    lastSent.current = coords;
    let cancelled = false;
    shareLocationAndCount(coords)
      .then((result) => {
        if (!cancelled) setNearby(result);
      })
      .catch(() => {
        // Compteur indisponible : l'écran reste utilisable sans.
        lastSent.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  return nearby;
}
