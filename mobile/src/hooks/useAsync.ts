import { useCallback, useEffect, useState, type DependencyList } from "react";

import { getApiErrorMessage } from "../services/api";

interface AsyncState<T> {
  data: T | undefined;
  error: string | null;
  /** Premier chargement (aucune donnée encore affichée). */
  isLoading: boolean;
  /** Rechargement déclenché par l'utilisateur (tirer pour rafraîchir). */
  isRefreshing: boolean;
  refresh: () => void;
  /** Remplace localement les données (ex. après une action réussie). */
  setData: (updater: (current: T | undefined) => T | undefined) => void;
}

/**
 * Charge une ressource asynchrone et expose chargement / erreur / rafraîchissement.
 * Passer `enabled: false` tant qu'un prérequis manque (ex. territoire actif).
 * Une réponse arrivée après un changement de dépendances est ignorée.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  { enabled = true, errorMessage = "Impossible de charger les données." } = {}
): AsyncState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [settledKey, setSettledKey] = useState(-1);
  const [requestKey, setRequestKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const key = requestKey;

    loader()
      .then((result) => {
        if (cancelled) return;
        setDataState(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, errorMessage));
      })
      .finally(() => {
        if (cancelled) return;
        setSettledKey(key);
        setIsRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // `loader` change à chaque rendu : ce sont `deps` qui pilotent le rechargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, requestKey, ...deps]);

  const refresh = useCallback(() => {
    setError(null);
    setIsRefreshing(true);
    setRequestKey((key) => key + 1);
  }, []);

  const setData = useCallback(
    (updater: (current: T | undefined) => T | undefined) => setDataState(updater),
    []
  );

  return {
    data,
    error,
    isLoading: enabled && data === undefined && error === null && settledKey !== requestKey,
    isRefreshing,
    refresh,
    setData,
  };
}
