import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * RATE LIMITING — endpoints d'authentification (P0-1)
 *
 * Ciblé uniquement sur les routes sensibles (login/register/forgot/reset
 * password) — jamais de limiteur global sur l'API. En mémoire (store par
 * défaut d'express-rate-limit) : cohérent avec l'anti-brute-force déjà en
 * place côté admin (cf. AdminAuthService.login), suffisant pour une
 * instance unique.
 *
 * Le login et la demande de reset combinent IP + email ciblé : une IP seule
 * ne suffit ni à échapper à la limite (elle reste plafonnée globalement),
 * ni à la déclencher pour tout le monde derrière une IP partagée — c'est le
 * COUPLE (ip, compte visé) qui est throttlé, ce qui bloque à la fois le
 * bourrinage d'un compte précis depuis plusieurs IP tournantes et le
 * bourrinage de plusieurs comptes depuis une seule IP.
 */

function normalizeEmail(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : "unknown";
}

function ipAndEmailKey(req: Request): string {
  const email = normalizeEmail((req.body as { email?: unknown } | undefined)?.email);
  return `${ipKeyGenerator(req.ip ?? "unknown")}:${email}`;
}

function tooManyRequestsHandler(message: string) {
  return (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      message,
      code: "TOO_MANY_REQUESTS",
    });
  };
}

/**
 * Fabrique réutilisée par les limiteurs nommés ci-dessous, et exportée pour
 * les tests : permet de construire une instance à fenêtre courte afin de
 * vérifier le comportement réel (seuil atteint, réinitialisation après la
 * fenêtre) sans dépendre des délais de production ni polluer l'état des
 * limiteurs réels partagés par toute la suite de tests.
 */
export function createAuthRateLimiter(options: {
  windowMs: number;
  limit: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  /** Ne compte que les réponses de succès (statut < 400) dans le quota —
   * utile quand seule l'issue "positive" de l'action (ex. compte réellement
   * créé) constitue le risque à limiter, pas une simple erreur de saisie. */
  skipFailedRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: options.skipFailedRequests ?? false,
    handler: tooManyRequestsHandler(options.message),
    ...(options.keyGenerator ? { keyGenerator: options.keyGenerator } : {}),
  });
}

export const loginLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Trop de tentatives de connexion. Réessaie dans quelques minutes.",
  keyGenerator: ipAndEmailKey,
});

export const registerLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Trop de comptes créés depuis cette adresse. Réessaie plus tard.",
  // Seuls les comptes réellement créés comptent : une IP qui enchaîne des
  // essais rejetés (email déjà pris, mot de passe trop court...) ne doit pas
  // se voir bloquée pour autant, seul le spam de créations réussies compte.
  skipFailedRequests: true,
});

export const forgotPasswordLimiter = createAuthRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Trop de demandes de réinitialisation. Réessaie dans quelques instants.",
  keyGenerator: ipAndEmailKey,
});

export const resetPasswordLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Trop de tentatives. Réessaie dans quelques minutes.",
});
