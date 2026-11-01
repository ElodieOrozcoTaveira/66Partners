import { create, isAxiosError } from "axios";

import { API_BASE_URL, API_ORIGIN } from "../config/env";
import { getAuthToken } from "../storage/auth.storage";

export const api = create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Réseau mobile parfois lent : même valeur que le client web.
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Appelé quand le backend rejette le jeton (401 sur une requête authentifiée) :
 * l'AuthProvider s'y abonne pour vider la session et renvoyer vers la connexion.
 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error?.config?.headers?.Authorization);

    // Un 401 sans jeton (ex. mauvais mot de passe au login) n'est pas une
    // expiration de session : on laisse l'écran afficher l'erreur.
    if (isAxiosError(error) && error.response?.status === 401 && hadToken) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

/** Format d'erreur renvoyé par le backend (cf. error.middleware.ts). */
export interface ApiErrorBody {
  success: false;
  message?: string;
  code?: string;
}

/**
 * Message lisible pour l'utilisateur à partir de n'importe quelle erreur
 * d'appel API. Ne renvoie jamais de détail technique brut.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return error.code === "ECONNABORTED"
        ? "Le serveur met trop de temps à répondre. Réessaie dans un instant."
        : "Connexion impossible. Vérifie ta connexion internet.";
    }

    const message = error.response.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.response.status >= 500) {
      return "Le service rencontre un problème. Réessaie plus tard.";
    }
  }

  return fallback;
}

/** Code d'erreur métier du backend (ex. "ALREADY_REQUESTED"), si présent. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
}

/**
 * Les fichiers uploadés sont référencés en chemin relatif ("/uploads/x.webp")
 * côté backend : on les rattache à l'origine de l'API.
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
