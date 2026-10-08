import { api } from "./api";
import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  RegisterInput,
} from "../types/auth";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", input);

  return response.data;
}

export async function register(
  input: RegisterInput
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", input);

  return response.data;
}

export async function getMe(): Promise<MeResponse> {
  const response = await api.get<MeResponse>("/auth/me");

  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
}

export async function resetPassword(
  token: string,
  password: string
) {
  const response = await api.post("/auth/reset-password", {
    token,
    password,
  });

  return response.data;
}