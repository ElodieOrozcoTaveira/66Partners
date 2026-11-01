/**
 * Configuration publique de l'application.
 *
 * Les variables EXPO_PUBLIC_* sont inlinées dans le bundle au build : elles
 * sont lisibles par n'importe qui ayant l'application, donc jamais de secret
 * ici. Chaque variable doit être lue en notation pointée
 * (process.env.EXPO_PUBLIC_X) pour être inlinée par Expo.
 */

// Repli sur la production : comportement historique de l'app mobile. En
// développement, définir EXPO_PUBLIC_API_ORIGIN dans mobile/.env (cf.
// .env.example) pour pointer vers le staging ou une API locale.
const DEFAULT_API_ORIGIN = "https://api.66partners.fr";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Origine du backend, ex. "https://api.66partners.fr" (sans /api). */
export const API_ORIGIN = stripTrailingSlash(
  process.env.EXPO_PUBLIC_API_ORIGIN || DEFAULT_API_ORIGIN
);

/** Base des routes REST. */
export const API_BASE_URL = `${API_ORIGIN}/api`;

/** Site web public : pages légales, réinitialisation du mot de passe. */
export const WEB_ORIGIN = stripTrailingSlash(
  process.env.EXPO_PUBLIC_WEB_ORIGIN || "https://66partners.fr"
);

/**
 * Connexion Google (identifiants OAuth publics, pas des secrets).
 * - WEB : le MÊME client que le site et que GOOGLE_CLIENT_ID côté backend.
 *   L'ID token natif est émis pour ce client (audience), donc le backend le
 *   vérifie sans modification.
 * - IOS : client OAuth de type iOS (bundle id de l'app), requis sur iPhone.
 * Sans client WEB, le bouton Google est masqué.
 */
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

export const LEGAL_URLS = {
  privacy: `${WEB_ORIGIN}/confidentialite`,
  legalNotice: `${WEB_ORIGIN}/mentionslegales`,
  contact: `${WEB_ORIGIN}/contact`,
  faq: `${WEB_ORIGIN}/FAQ`,
} as const;
