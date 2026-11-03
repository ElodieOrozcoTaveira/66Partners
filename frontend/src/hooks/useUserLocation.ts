import { useCallback, useEffect, useState } from "react";
import type { Coordinates } from "../lib/geo";

export type LocationStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

/**
 * Position du navigateur, à la demande (comme l'app mobile).
 *
 * - `ask: false` (tableau de bord) : on ne déclenche jamais la demande
 *   d'autorisation ; on localise seulement si elle a déjà été accordée.
 * - `locate()` (bouton « Autour de moi ») : déclenche la demande si besoin.
 */
export function useUserLocation({ ask = false }: { ask?: boolean } = {}) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<Coordinates | null>(null);

  const locate = useCallback((): Promise<Coordinates | null> => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return Promise.resolve(null);
    }
    setStatus("locating");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setCoords(next);
          setStatus("granted");
          resolve(next);
        },
        (error) => {
          setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
          resolve(null);
        },
        { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 15000 },
      );
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (ask) {
        await locate();
        return;
      }
      // Sans demande : uniquement si l'autorisation est déjà accordée.
      try {
        const permission = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        if (!cancelled && permission?.state === "granted") await locate();
      } catch {
        // API Permissions indisponible : on ne demande rien.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ask, locate]);

  return { status, coords, locate };
}
