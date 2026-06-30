import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
/**
 * CONTRÔLEUR D'AUTHENTIFICATION
 *
 * Orchestre les requêtes HTTP et délègue la logique métier au service
 */
export declare class AuthController {
    /**
     * POST /api/auth/register
     * Inscription d'un nouvel utilisateur
     */
    static register(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/login
     * Connexion d'un utilisateur existant
     */
    static login(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/auth/me
     * Récupérer le profil de l'utilisateur authentifié (via le token JWT)
     */
    static getProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map