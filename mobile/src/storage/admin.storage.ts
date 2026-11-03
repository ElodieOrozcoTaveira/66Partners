import * as SecureStore from "expo-secure-store";

// Jeton de l'espace admin (12 h, cf. backend/src/utils/adminJwt.ts) : donne
// accès à toutes les données, donc stockage chiffré comme le jeton utilisateur.
const ADMIN_TOKEN_KEY = "66partners_admin_token";

export async function saveAdminToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
}

export async function getAdminToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
}

export async function removeAdminToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
}
