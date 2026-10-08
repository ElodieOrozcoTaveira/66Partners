export interface User {
  id: string;
  email: string;
  pseudo: string;
  city?: string | null;
  headline?: string | null;
  lookingFor?: string | null;
  openTo?: string | null;
  avatar?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

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
  avatar?: string;
  territoryCode?: string;
  termsAccepted: true;
}