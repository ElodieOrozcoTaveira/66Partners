import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../lib/axios";

type User = {
  id: string;
  pseudo: string;
  email: string;
  avatar: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
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

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get<{ user: User }>("/api/users/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  async function login(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const res = await api.get<{ user: User }>("/api/users/me");
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
