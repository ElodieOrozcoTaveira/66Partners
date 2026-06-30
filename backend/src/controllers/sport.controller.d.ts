import type { Request, Response } from "express";
/**
 * CONTRÔLEUR SPORT
 *
 * Orchestre les requêtes HTTP liées à la liste de référence des sports
 * et délègue la logique métier à SportService.
 */
export declare class SportController {
    /**
     * GET /api/sports
     * Liste de tous les sports
     */
    static list(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/sports/:id
     * Récupération d'un sport par son ID
     */
    static getById(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/sports
     * Création d'un nouveau sport
     */
    static create(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /api/sports/:id
     * Mise à jour d'un sport
     */
    static update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/sports/:id
     * Suppression d'un sport
     */
    static remove(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=sport.controller.d.ts.map