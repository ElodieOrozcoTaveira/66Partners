import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getTerritories,
  type Territory,
} from "../services/territory.service";

interface TerritoryContextValue {
  territories: Territory[];
  isLoading: boolean;
  refreshTerritories: () => Promise<void>;
}

const TerritoryContext =
  createContext<TerritoryContextValue | undefined>(undefined);

interface TerritoryProviderProps {
  children: ReactNode;
}

export function TerritoryProvider({
  children,
}: TerritoryProviderProps) {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTerritories = useCallback(async () => {
    try {
      setIsLoading(true);

      const data = await getTerritories();

      setTerritories(data);
    } catch (error) {
      console.error(
        "[TERRITORY] Impossible de récupérer les territoires:",
        error
      );

      setTerritories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTerritories();
  }, [refreshTerritories]);

  return (
    <TerritoryContext.Provider
      value={{
        territories,
        isLoading,
        refreshTerritories,
      }}
    >
      {children}
    </TerritoryContext.Provider>
  );
}

export function useTerritories(): TerritoryContextValue {
  const context = useContext(TerritoryContext);

  if (!context) {
    throw new Error(
      "useTerritories doit être utilisé à l'intérieur de TerritoryProvider"
    );
  }

  return context;
}
