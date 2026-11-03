import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  fetchAdminTerritories,
  loginAdminRequest,
  setAdminUnauthorizedHandler,
  type AdminLoginResult,
  type AdminTerritory,
} from "../services/admin.service";
import { getAdminToken, removeAdminToken, saveAdminToken } from "../storage/admin.storage";
import { useAuth } from "./AuthContext";

interface AdminContextValue {
  /** Jeton admin valide présent sur le téléphone. */
  isAdmin: boolean;
  /** Restauration du jeton au démarrage. */
  isRestoring: boolean;
  /** L'espace admin a déjà été ouvert sur ce téléphone : son accès reste
   *  visible dans les paramètres (non sensible, AsyncStorage). */
  entryUnlocked: boolean;
  login: (password: string) => Promise<AdminLoginResult>;
  logout: () => Promise<void>;
  /** Filtre territoire partagé par Statistiques, Utilisateurs et Activités ("" = tous). */
  territory: string;
  setTerritory: (code: string) => void;
  territories: AdminTerritory[];
  /** Incrémenté après une modification (ex. compte supprimé) : les listes se rechargent. */
  dataVersion: number;
  notifyDataChanged: () => void;
}

const ENTRY_KEY = "66partners.adminEntryUnlocked";

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

/** Expiration lue dans le jeton (sans vérifier la signature : le serveur s'en charge). */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [entryUnlocked, setEntryUnlocked] = useState(false);
  const [territory, setTerritory] = useState("");
  const [territories, setTerritories] = useState<AdminTerritory[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const notifyDataChanged = useCallback(() => setDataVersion((version) => version + 1), []);

  // Le jeton est effacé avant de quitter l'écran admin : aucune requête ne
  // peut repartir avec lui.
  const clearSession = useCallback(async () => {
    await removeAdminToken().catch(() => undefined);
    setIsAdmin(false);
    setTerritory("");
    setTerritories([]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminToken().catch(() => null),
      AsyncStorage.getItem(ENTRY_KEY).catch(() => null),
    ]).then(async ([token, entry]) => {
      if (cancelled) return;
      setEntryUnlocked(entry === "1");
      if (token && !isExpired(token)) {
        setIsAdmin(true);
      } else if (token) {
        await removeAdminToken().catch(() => undefined);
      }
      setIsRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Jeton refusé par le serveur : retour à l'écran de connexion admin.
  useEffect(() => {
    setAdminUnauthorizedHandler(() => void clearSession());
    return () => setAdminUnauthorizedHandler(null);
  }, [clearSession]);

  // L'espace admin est rangé derrière la session utilisateur : la quitter
  // (déconnexion, compte supprimé) ferme aussi l'accès admin.
  useEffect(() => {
    if (authLoading || isAuthenticated || isRestoring) return;
    removeAdminToken()
      .catch(() => undefined)
      .then(() => {
        setIsAdmin(false);
        setTerritory("");
        setTerritories([]);
      });
  }, [authLoading, isAuthenticated, isRestoring]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminTerritories()
      .then(setTerritories)
      .catch(() => setTerritories([]));
  }, [isAdmin]);

  const login = useCallback(async (password: string) => {
    const result = await loginAdminRequest(password);
    if (result.success) {
      await saveAdminToken(result.token);
      AsyncStorage.setItem(ENTRY_KEY, "1").catch(() => undefined);
      setEntryUnlocked(true);
      setIsAdmin(true);
    }
    return result;
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      isAdmin,
      isRestoring,
      entryUnlocked,
      login,
      logout: clearSession,
      territory,
      setTerritory,
      territories,
      dataVersion,
      notifyDataChanged,
    }),
    [isAdmin, isRestoring, entryUnlocked, login, clearSession, territory, territories, dataVersion, notifyDataChanged]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin doit être utilisé à l'intérieur de AdminProvider");
  }
  return context;
}
