/** Profil de l'utilisateur connecté (GET /auth/me, GET/PATCH /users/me). */
export interface User {
  id: string;
  email: string;
  pseudo: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

/** POST /auth/google : trois issues possibles pour un même jeton Google. */
export type GoogleAuthResponse =
  | (AuthResponse & { status: "LOGGED_IN" })
  | { success: boolean; status: "NEW_ACCOUNT" | "EMAIL_ALREADY_REGISTERED"; email: string };

export interface MeResponse {
  success: boolean;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  pseudo: string;
  email: string;
  password: string;
  city?: string;
  territoryCode?: string;
  termsAccepted: true;
}
