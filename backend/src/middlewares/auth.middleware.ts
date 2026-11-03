import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentification requise",
      code: "UNAUTHENTICATED",
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Token invalide ou expiré",
      code: "INVALID_TOKEN",
    });
  }
}

/**
 * Route publique qui s'adapte au membre connecté (ex. liste des activités
 * sans celles des membres bloqués) : renseigne req.userId si un jeton valide
 * est fourni, sans jamais refuser la requête sinon.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.userId = verifyToken(authHeader.slice("Bearer ".length)).id;
    } catch {
      // Jeton invalide ou expiré : la route reste publique, simplement sans filtre.
    }
  }
  next();
}
