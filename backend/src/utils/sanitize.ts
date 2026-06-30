import sanitizeHtml from "sanitize-html";

/**
 * Nettoie une chaîne de texte libre saisie par l'utilisateur en retirant
 * tout HTML (balises, attributs, scripts) avant stockage en base.
 *
 * Sert de filet de sécurité côté API contre le XSS stocké : même si le
 * frontend oublie d'échapper une valeur à l'affichage, aucun payload
 * HTML/JS ne peut être persisté via ces champs.
 */
export function sanitizeText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
