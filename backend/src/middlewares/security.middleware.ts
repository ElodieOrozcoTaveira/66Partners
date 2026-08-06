import type { NextFunction, Request, Response } from "express";
import type { HelmetOptions } from "helmet";

/**
 * Content-Security-Policy durcie pour une API JSON pure : aucune source de
 * script, style, frame ou ressource externe n'est autorisée. Limite l'impact
 * d'une éventuelle XSS (ex. si une réponse d'erreur HTML par défaut venait
 * à être servie par un proxy en amont).
 */
export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
};

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CORS_ORIGIN accepte une liste d'origines séparées par des virgules (ex:
 * dev local + tunnel ngrok pour les tests mobile) en plus d'une origine
 * unique.
 */
export function getAllowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Garde-fou CSRF.
 *
 * Cette API authentifie via un JWT transmis dans l'en-tête
 * `Authorization: Bearer <token>`, jamais via un cookie (voir
 * middlewares/auth.middleware.ts). Un navigateur n'attache jamais cet
 * en-tête automatiquement lors d'une requête cross-site — contrairement à
 * un cookie de session — donc cette API est intrinsèquement résistante au
 * CSRF classique tant qu'aucun cookie d'authentification n'est introduit.
 *
 * Cette vérification d'Origin/Referer est une couche de défense
 * supplémentaire (mauvaise configuration CORS, proxy, etc.). Elle ne
 * bloque pas les requêtes sans Origin/Referer (clients non-navigateur :
 * mobile, tests, server-to-server).
 */
export function verifyOrigin(req: Request, res: Response, next: NextFunction): void {
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    next();
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin ?? req.headers.referer;

  if (allowedOrigins.length > 0 && origin && !allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
    res.status(403).json({
      success: false,
      message: "Origine de la requête non autorisée",
      code: "FORBIDDEN_ORIGIN",
    });
    return;
  }

  next();
}
