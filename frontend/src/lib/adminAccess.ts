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
