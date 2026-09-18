import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import api from "../lib/axios";

export type User = {
  id: string;
  pseudo: string;
  email: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  createdAt: string;
};

// Renseigné par login() quand celle-ci renvoie false, pour distinguer deux
// cas que les appelants (ModaleContent, ModaleRegisterContent) doivent
// traiter différemment :
// - "storage" : le backend a authentifié l'utilisateur (200 + JWT) mais le
//   token n'a pas pu être mémorisé côté client (navigation privée, extension
//   bloquant le stockage, quota dépassé...) — jamais un échec d'auth ;
// - "profile" : le token est mémorisé mais /api/users/me a échoué.
// login() garde un retour booléen (inchangé) pour ne pas casser les autres
// appelants (useGoogleAuth/useFacebookAuth) qui ne font qu'un `if (ok)`.
// Exposée via une fonction (pas une valeur d'état) : un appelant qui fait
// `const ok = await login(token); ...getLastLoginFailureReason()` doit lire
// la valeur à jour au moment de l'appel, pas celle capturée au dernier
// rendu (setState + await créerait une closure obsolète).
export type LoginFailureReason = "storage" | "profile";

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<boolean>;
  getLastLoginFailureReason: () => LoginFailureReason | null;
  refreshUser: (tokenOverride?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const lastLoginFailureReasonRef = useRef<LoginFailureReason | null>(null);
  function getLastLoginFailureReason() {
    return lastLoginFailureReasonRef.current;
  }

  async function refreshUser(tokenOverride?: string) {
    const effectiveToken = tokenOverride ?? token;
    if (!effectiveToken) {
      setUser(null);
      return false;
    }

    try {
      console.debug(
        "AuthContext: refreshUser -> token present, fetching /api/users/me",
        { effectiveToken: effectiveToken?.slice?.(0, 20) },
      );
      const res = await api.get<{ user: User }>("/api/users/me");
      console.debug("AuthContext: /api/users/me response", res);
      setUser(res.data.user);
      return true;
    } catch {
      // log error details for debugging
      // Note: error details are not available here directly, use console.trace to help
      console.error("AuthContext: refreshUser failed", arguments);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      return false;
    }
  }

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    refreshUser().finally(() => setIsLoading(false));
  }, [token]);

  async function login(newToken: string): Promise<boolean> {
    console.debug(
      "AuthContext: login -> saving token",
      newToken?.slice?.(0, 20),
    );
    lastLoginFailureReasonRef.current = null;

    try {
      localStorage.setItem("token", newToken);
    } catch (err) {
      // Le backend a bien authentifié l'utilisateur (200 + JWT) : ce n'est
      // pas un échec d'authentification, seulement un stockage indisponible.
      console.error("AuthContext: login -> localStorage.setItem failed", err);
      lastLoginFailureReasonRef.current = "storage";
      return false;
    }

    setToken(newToken);
    const ok = await refreshUser(newToken);
    console.debug("AuthContext: login -> refreshUser ok?", ok);
    if (!ok) lastLoginFailureReasonRef.current = "profile";
    return ok;
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        getLastLoginFailureReason,
        refreshUser,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
