import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
/**
 * CONTRÔLEUR PARTICIPATION
 *
 * Orchestre les requêtes HTTP liées aux demandes de participation
 * et délègue la logique métier à ParticipationService.
 */
export declare class ParticipationController {
    /**
     * POST /api/activities/:id/join
     * Demande pour rejoindre une activité
     */
    static join(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * PUT /api/participations/:id/accept
     * Acceptation d'une demande de participation
     */
    static accept(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * PUT /api/participations/:id/refuse
     * Refus d'une demande de participation
     */
    static refuse(req: AuthenticatedRequest, res: Response): Promise<void>;
    /**
     * DELETE /api/participations/:id
     * Annulation d'une demande de participation
     */
    static cancel(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=participation.controller.d.ts.map