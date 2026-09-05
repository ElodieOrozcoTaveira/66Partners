import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../lib/axios";
import { useAuth } from "./AuthContext";

export type Territory = {
  id: string;
  code: string;
  name: string;
  slug: string;
  brandName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isActive: boolean;
};

const ACTIVE_TERRITORY_STORAGE_KEY = "activeTerritoryCode";

type TerritoryContextType = {
  /** Territoires de l'utilisateur connecté (vide si non connecté ou non chargé). */
  territories: Territory[];
  /** Territoire actif choisi par l'utilisateur — sert uniquement à filtrer
   *  les appels API ; le backend revérifie systématiquement l'appartenance. */
  activeTerritory: Territory | null;
  setActiveTerritory: (code: string) => void;
};

const TerritoryContext = createContext<TerritoryContextType | null>(null);

export function TerritoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_TERRITORY_STORAGE_KEY),
  );

  useEffect(() => {
    if (!user) {
      setTerritories([]);
      return;
    }

    api
      .get<{ territories: Territory[] }>("/api/territories/mine")
      .then((res) => setTerritories(res.data.territories))
      .catch(() => setTerritories([]));
  }, [user]);

  useEffect(() => {
    if (territories.length === 0) return;

    const stillMember = territories.some((t) => t.code === activeCode);
    if (!stillMember) {
      const fallback = territories[0];
      if (fallback) setActiveCode(fallback.code);
    }
  }, [territories, activeCode]);

  function setActiveTerritory(code: string) {
    localStorage.setItem(ACTIVE_TERRITORY_STORAGE_KEY, code);
    setActiveCode(code);
  }

  const activeTerritory = territories.find((t) => t.code === activeCode) ?? null;

  return (
    <TerritoryContext.Provider
      value={{ territories, activeTerritory, setActiveTerritory }}
    >
      {children}
    </TerritoryContext.Provider>
  );
}

export function useTerritory() {
  const ctx = useContext(TerritoryContext);
  if (!ctx) throw new Error("useTerritory must be used within TerritoryProvider");
  return ctx;
}
