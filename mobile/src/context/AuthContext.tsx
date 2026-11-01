import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AuthResponse, LoginInput, RegisterInput, User } from "../types/auth";
import {
  getMe,
  login as loginRequest,
  register as registerRequest,
} from "../services/auth.service";
import { setUnauthorizedHandler } from "../services/api";
import { deleteMyAccount } from "../services/user.service";
import {
  getAuthToken,
  removeAuthToken,
  saveAuthToken,
} from "../storage/auth.storage";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** true quand la session a été fermée parce que le jeton a expiré. */
  sessionExpired: boolean;

  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  /** Ouvre la session à partir d'une réponse déjà obtenue (ex. Google). */
  startSession: (response: Pick<AuthResponse, "token" | "user">) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Restauration de session au démarrage : le jeton (SecureStore) est
  // revalidé par le serveur via /auth/me, jamais considéré valide d'office.
  useEffect(() => {
    let cancelled = false;

    getAuthToken()
      .then(async (token) => {
        if (!token) return null;

        try {
          const response = await getMe();
          return response.success ? response.user : null;
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response?.status;
          // Jeton refusé : on l'efface. Erreur réseau : on le garde pour
          // réessayer au prochain lancement, mais sans ouvrir la session.
          if (status === 401 || status === 404) {
            await removeAuthToken();
          }
          return null;
        }
      })
      .then((restoredUser) => {
        if (!cancelled) setUserState(restoredUser);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Jeton expiré ou révoqué en cours d'utilisation (401 sur une requête
  // authentifiée) : on ferme la session, la navigation renvoie au login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      removeAuthToken().finally(() => {
        setUserState((current) => {
          if (current) setSessionExpired(true);
          return null;
        });
      });
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);

    await saveAuthToken(response.token);
    setSessionExpired(false);
    setUserState(response.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerRequest(input);

    await saveAuthToken(response.token);
    setSessionExpired(false);
    setUserState(response.user);
  }, []);

  const startSession = useCallback(
    async (response: Pick<AuthResponse, "token" | "user">) => {
      await saveAuthToken(response.token);
      setSessionExpired(false);
      setUserState(response.user);
    },
    []
  );

  const logout = useCallback(async () => {
    // Le JWT est sans état côté serveur (pas de route de révocation) : la
    // déconnexion consiste à supprimer le jeton de l'appareil.
    await removeAuthToken();
    setSessionExpired(false);
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await getMe();

    if (response.success) {
      setUserState(response.user);
    }
  }, []);

  const setUser = useCallback((nextUser: User) => {
    setUserState(nextUser);
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteMyAccount();
    await removeAuthToken();
    setSessionExpired(false);
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      sessionExpired,
      login,
      register,
      startSession,
      logout,
      refreshUser,
      setUser,
      deleteAccount,
    }),
    [user, isLoading, sessionExpired, login, register, startSession, logout, refreshUser, setUser, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }

  return context;
}
