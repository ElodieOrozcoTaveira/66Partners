import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";
import * as Location from "expo-location";

import type { Coordinates } from "../lib/geo";

export type LocationStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

/**
 * Position du téléphone, au premier plan uniquement (jamais en arrière-plan).
 *
 * Elle sert à cadrer la carte. L'écran Explorer en envoie ensuite une
 * version arrondie (~1 km) au serveur pour compter les sportifs autour.
 *
 * - À l'ouverture : si l'autorisation est déjà donnée, on localise ; si elle
 *   n'a jamais été demandée, on la demande ; si elle a été refusée, on ne
 *   redemande pas (la carte reste sur le territoire).
 *   Avec `{ ask: false }` (accueil), on ne demande jamais : on localise
 *   seulement si l'autorisation a déjà été donnée.
 * - `locate()` (bouton « Me localiser ») redemande l'autorisation si le
 *   système le permet, sinon propose d'ouvrir les réglages.
 */
export function useUserLocation({ ask = true }: { ask?: boolean } = {}) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const mounted = useRef(true);

  const readPosition = useCallback(async (): Promise<Coordinates | null> => {
    setStatus("locating");
    try {
      // Position récente d'abord (instantanée), puis position fraîche.
      const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
      if (last && mounted.current) {
        setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
      }
      const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: fresh.coords.latitude, longitude: fresh.coords.longitude };
      if (mounted.current) {
        setCoords(next);
        setStatus("granted");
      }
      return next;
    } catch {
      // GPS coupé, pas de signal… : on garde la dernière position connue s'il y en a une.
      if (mounted.current) setStatus("unavailable");
      return null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        let permission = await Location.getForegroundPermissionsAsync();
        if (ask && permission.status === "undetermined" && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!mounted.current) return;
        if (permission.status === "granted") await readPosition();
        else setStatus("denied");
      } catch {
        if (mounted.current) setStatus("unavailable");
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, [readPosition, ask]);

  const locate = useCallback(async (): Promise<Coordinates | null> => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") {
        setStatus("denied");
        Alert.alert(
          "Localisation désactivée",
          "Autorise 66Partners à accéder à ta position dans les réglages pour centrer la carte autour de toi.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Ouvrir les réglages", onPress: () => void Linking.openSettings() },
          ]
        );
        return null;
      }
      return await readPosition();
    } catch {
      setStatus("unavailable");
      return null;
    }
  }, [readPosition]);

  return { status, coords, locate };
}
