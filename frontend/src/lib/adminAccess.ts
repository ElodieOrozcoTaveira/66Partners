// Accès à l'espace admin (/admin/*), indépendant du compte utilisateur : le
// mot de passe est vérifié côté backend (POST /api/admin/auth/login), qui
// renvoie un jeton dédié mémorisé pour l'onglet en cours.

import axios from "axios";

export const ADMIN_TOKEN_STORAGE_KEY = "admin_token";

export function isAdminAccessGranted(): boolean {
  return Boolean(sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY));
}

export type AdminLoginResult =
  | { success: true }
  | { success: false; reason: "invalid" | "rate_limited" | "network" };

export async function loginAdmin(password: string): Promise<AdminLoginResult> {
  try {
    const res = await axios.post<{ success: boolean; token: string }>(
      `${import.meta.env.VITE_API_URL || ""}/api/admin/auth/login`,
      { password },
    );
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, res.data.token);
    return { success: true };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) return { success: false, reason: "rate_limited" };
      if (error.response?.status === 401) return { success: false, reason: "invalid" };
    }
    return { success: false, reason: "network" };
  }
}

export function revokeAdminAccess(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

// Un seul admin : pas d'email à saisir, le lien part toujours vers l'adresse
// fixe configurée côté serveur (ADMIN_RECOVERY_EMAIL).
export async function requestAdminPasswordReset(): Promise<{ success: boolean }> {
  try {
    await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/admin/auth/forgot-password`);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export type AdminResetPasswordResult =
  | { success: true }
  | { success: false; message: string };

export async function resetAdminPassword(
  token: string,
  password: string,
): Promise<AdminResetPasswordResult> {
  try {
    await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/admin/auth/reset-password`, {
      token,
      password,
    });
    return { success: true };
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
      return { success: false, message: error.response.data.message };
    }
    return { success: false, message: "Impossible de réinitialiser le mot de passe pour le moment." };
  }
}
