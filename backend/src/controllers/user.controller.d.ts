import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
/**
 * CONTRÔLEUR UTILISATEUR
 *
 * Orchestre les requêtes HTTP liées au profil utilisateur et délègue
 * la logique métier à UserService.
 */
export declare class UserController {
    /**
     * GET /api/users/me
     * Récupérer le profil de l'utilisateur authentifié
     */
    static getMe(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * GET /api/users/:id
     * Récupérer le profil public d'un utilisateur
     */
    static getUserById(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /api/users/me
     * Mettre à jour le profil de l'utilisateur authentifié
     */
    static updateMe(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * DELETE /api/users/me
     * Supprimer le compte de l'utilisateur authentifié
     */
    static deleteMe(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * GET /api/users/me/sports
     * Lister les sports pratiqués par l'utilisateur authentifié
     */
    static listMySports(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * GET /api/users/:id/sports
     * Lister les sports pratiqués par un utilisateur (profil public)
     */
    static listUserSports(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/users/me/sports
     * Ajouter ou mettre à jour un sport pratiqué par l'utilisateur authentifié
     */
    static setMySport(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * DELETE /api/users/me/sports/:sportId
     * Retirer un sport pratiqué par l'utilisateur authentifié
     */
    static removeMySport(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=user.controller.d.ts.map