import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../lib/axios";

export type User = {
  id: string;
  pseudo: string;
  email: string;
  city: string | null;
  bio: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  dispo: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<boolean>;
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

  async function login(newToken: string) {
    console.debug(
      "AuthContext: login -> saving token",
      newToken?.slice?.(0, 20),
    );
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const ok = await refreshUser(newToken);
    console.debug("AuthContext: login -> refreshUser ok?", ok);
    return ok;
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, refreshUser, logout, isLoading }}
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
