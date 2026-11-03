import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { BlockService } from "../services/block.services.js";

/**
 * Profil d'un membre bloqué (dans un sens ou dans l'autre) : même réponse
 * qu'un compte inexistant, pour que le blocage ne soit jamais révélé.
 * À placer après requireAuth et la validation de l'identifiant.
 */
export function hideIfBlocked(param: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params[param];
      if (req.userId && typeof targetId === "string" && (await BlockService.isBlockedBetween(req.userId, targetId))) {
        res.status(404).json({ success: false, message: "Utilisateur non trouvé", code: "USER_NOT_FOUND" });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
