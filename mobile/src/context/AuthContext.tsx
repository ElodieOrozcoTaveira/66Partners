import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  LoginInput,
  RegisterInput,
  User,
} from "../types/auth";

import {
  getMe,
  login as loginRequest,
  register as registerRequest,
} from "../services/auth.service";

import {
  getAuthToken,
  removeAuthToken,
  saveAuthToken,
} from "../storage/auth.storage";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
  try {
    console.log("[AUTH] Restauration de session...");

    const token = await getAuthToken();
    console.log(
  "[AUTH] Token trouvé :",
  token ? "OUI" : "NON"
);

    console.log(
      "[AUTH] Token trouvé :",
      token ? "OUI" : "NON"
    );

    if (!token) {
      setUser(null);
      return;
    }

    console.log("[AUTH] Vérification du token avec /auth/me...");

    const response = await getMe();

    console.log("[AUTH] /auth/me :", response);

    if (response.success) {
      setUser(response.user);
    } else {
      await removeAuthToken();
      setUser(null);
    }
  } catch (error: any) {
    console.log(
      "[AUTH] Erreur restauration :",
      error?.response?.status,
      error?.response?.data ?? error?.message
    );

    if (error?.response?.status === 401) {
      await removeAuthToken();
    }

    setUser(null);
  } finally {
    console.log("[AUTH] Fin restauration");
    setIsLoading(false);
  }
}, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);

    await saveAuthToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerRequest(input);

    await saveAuthToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await removeAuthToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await getMe();

    if (response.success) {
      setUser(response.user);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur de AuthProvider"
    );
  }

  return context;
}