import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getMyTerritories,
  getTerritories,
  joinTerritory as joinTerritoryRequest,
} from "../services/territory.service";
import type { Territory } from "../types/domain";
import { useAuth } from "./AuthContext";

interface TerritoryContextValue {
  /** Territoires de l'utilisateur connecté. */
  territories: Territory[];
  /** Territoire utilisé pour filtrer les activités, créer, et pour le thème :
   *  dernier choix explicite s'il reste valide, sinon le territoire principal
   *  (isDefault). Jamais "le premier de la liste" (même règle que le web). */
  activeTerritory: Territory | null;
  /** Territoires ouverts que l'utilisateur n'a pas encore rejoints. */
  joinableTerritories: Territory[];
  /** Choisit le territoire actif parmi ceux de l'utilisateur (mémorisé sur le téléphone). */
  setActiveTerritory: (code: string) => void;
  /** Rejoint un territoire ouvert puis recharge la liste. */
  joinTerritory: (code: string) => Promise<void>;
  isLoading: boolean;
  error: boolean;
  refreshTerritories: () => void;
}

/** Résultat d'un chargement, rattaché à l'utilisateur pour qui il a été fait. */
interface LoadResult {
  userId: string;
  territories: Territory[];
  /** Territoires ouverts (GET /territories), pour proposer d'en rejoindre un. */
  openTerritories: Territory[];
  /** Dernier territoire choisi sur ce téléphone pour ce compte. */
  chosenCode: string | null;
  error: boolean;
}

// Préférence d'affichage par compte (non sensible) : AsyncStorage suffit.
const activeKey = (userId: string) => `66partners.activeTerritory.${userId}`;

const TerritoryContext = createContext<TerritoryContextValue | undefined>(undefined);

export function TerritoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [result, setResult] = useState<LoadResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Fin de session (déconnexion, session expirée, compte supprimé) : on oublie
  // le territoire choisi, pour revenir au territoire principal à la prochaine
  // connexion. Le choix reste conservé si l'app est simplement fermée.
  const previousUserId = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousUserId.current;
    previousUserId.current = userId;
    if (previous && previous !== userId) {
      AsyncStorage.removeItem(activeKey(previous)).catch(() => undefined);
      // Oublie aussi la version en mémoire : sinon une reconnexion au même
      // compte réafficherait un instant l'ancien territoire.
      setResult(null);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    Promise.all([
      getMyTerritories(),
      getTerritories().catch(() => [] as Territory[]),
      AsyncStorage.getItem(activeKey(userId)).catch(() => null),
    ])
      .then(([territories, openTerritories, chosenCode]) => ({
        userId,
        territories,
        openTerritories,
        chosenCode,
        error: false,
      }))
      .catch(() => ({ userId, territories: [], openTerritories: [], chosenCode: null, error: true }))
      .then((next) => {
        if (!cancelled) setResult(next);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const refreshTerritories = useCallback(() => {
    setResult(null);
    setReloadKey((key) => key + 1);
  }, []);

  const setActiveTerritory = useCallback(
    (code: string) => {
      if (!userId) return;
      AsyncStorage.setItem(activeKey(userId), code).catch(() => undefined);
      setResult((current) =>
        current && current.userId === userId ? { ...current, chosenCode: code } : current
      );
    },
    [userId]
  );

  const joinTerritory = useCallback(
    async (code: string) => {
      await joinTerritoryRequest(code);
      const territories = await getMyTerritories();
      setResult((current) =>
        current && current.userId === userId ? { ...current, territories } : current
      );
    },
    [userId]
  );

  const value = useMemo<TerritoryContextValue>(() => {
    // Un résultat obtenu pour un autre compte (déconnexion/reconnexion) n'est
    // jamais réutilisé.
    const current = result && result.userId === userId ? result : null;
    const territories = current?.territories ?? [];

    const chosen = territories.find((territory) => territory.code === current?.chosenCode);

    return {
      territories,
      activeTerritory: chosen ?? territories.find((territory) => territory.isDefault) ?? null,
      joinableTerritories: (current?.openTerritories ?? []).filter(
        (open) => !territories.some((mine) => mine.id === open.id)
      ),
      setActiveTerritory,
      joinTerritory,
      isLoading: userId !== null && current === null,
      error: current?.error ?? false,
      refreshTerritories,
    };
  }, [result, userId, refreshTerritories, setActiveTerritory, joinTerritory]);

  return <TerritoryContext.Provider value={value}>{children}</TerritoryContext.Provider>;
}

export function useTerritory(): TerritoryContextValue {
  const context = useContext(TerritoryContext);

  if (!context) {
    throw new Error("useTerritory doit être utilisé à l'intérieur de TerritoryProvider");
  }

  return context;
}
