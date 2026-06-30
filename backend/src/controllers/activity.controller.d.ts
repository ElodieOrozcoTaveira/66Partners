import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
/**
 * CONTRÔLEUR ACTIVITÉ
 *
 * Orchestre les requêtes HTTP liées aux activités sportives et délègue
 * la logique métier à ActivityService.
 */
export declare class ActivityController {
    /**
     * POST /api/activities
     * Création d'une nouvelle activité
     */
    static create(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * GET /api/activities
     * Liste des activités (filtres optionnels : city, sportId, status)
     */
    static list(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/activities/:id
     * Récupération d'une activité par son ID
     */
    static getById(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /api/activities/:id
     * Mise à jour d'une activité (réservé à son créateur)
     */
    static update(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * DELETE /api/activities/:id
     * Suppression d'une activité (réservé à son créateur)
     */
    static remove(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=activity.controller.d.ts.map