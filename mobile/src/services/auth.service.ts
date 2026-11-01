import { api } from "./api";
import type {
  AuthResponse,
  GoogleAuthResponse,
  LoginInput,
  MeResponse,
  RegisterInput,
} from "../types/auth";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", input);

  return response.data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", input);

  return response.data;
}

/**
 * Constate l'état du compte Google (cf. AuthController.googleAuth) : ne crée
 * ni ne fusionne jamais rien côté serveur.
 */
export async function googleAuth(credential: string): Promise<GoogleAuthResponse> {
  const response = await api.post<GoogleAuthResponse>("/auth/google", { credential });

  return response.data;
}

/** Seule voie de création d'un compte Google : CGU acceptées obligatoires. */
export async function googleComplete(
  credential: string,
  territoryCode?: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/google/complete", {
    credential,
    termsAccepted: true,
    ...(territoryCode ? { territoryCode } : {}),
  });

  return response.data;
}

/** Associe Google au compte connecté (après un login mot de passe). */
export async function googleLink(credential: string): Promise<void> {
  await api.post("/auth/google/link", { credential });
}

export async function getMe(): Promise<MeResponse> {
  const response = await api.get<MeResponse>("/auth/me");

  return response.data;
}

/**
 * Envoie l'email de réinitialisation. Le lien reçu ouvre la page web
 * /reinitialiser-mot-de-passe (cf. AuthService.requestPasswordReset) : le
 * nouveau mot de passe se définit donc sur le site, puis sert aussi sur mobile.
 */
export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}
