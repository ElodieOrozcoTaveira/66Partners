import { useEffect, useRef, useState } from "react";
import api from "../lib/axios";
import { distanceKm, type Coordinates } from "../lib/geo";

export interface NearbyCount {
  count: number;
  radiusKm: number;
}

/**
 * Nombre de sportifs autour de la position (POST /api/nearby, comme l'app
 * mobile). La position est arrondie à ~1 km avant envoi ; le serveur ne
 * renvoie qu'un nombre. On ne redemande que si l'on a bougé d'au moins 1 km.
 */
export function useNearbyCount(coords: Coordinates | null): NearbyCount | null {
  const [nearby, setNearby] = useState<NearbyCount | null>(null);
  const lastSent = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!coords) return;
    if (lastSent.current && distanceKm(lastSent.current, coords) < 1) return;
    lastSent.current = coords;
    let cancelled = false;
    const round = (value: number) => Math.round(value * 100) / 100;
    api
      .post<{ success: boolean } & NearbyCount>("/api/nearby", {
        latitude: round(coords.latitude),
        longitude: round(coords.longitude),
      })
      .then((res) => {
        if (!cancelled) setNearby({ count: res.data.count, radiusKm: res.data.radiusKm });
      })
      .catch(() => {
        lastSent.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  return nearby;
}
