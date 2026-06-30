import { ParticipationService, ParticipationError, } from "../services/participation.services.js";
/**
 * CONTRÔLEUR PARTICIPATION
 *
 * Orchestre les requêtes HTTP liées aux demandes de participation
 * et délègue la logique métier à ParticipationService.
 */
export class ParticipationController {
    /**
     * POST /api/activities/:id/join
     * Demande pour rejoindre une activité
     */
    static async join(req, res) {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentification requise",
                    code: "UNAUTHENTICATED",
                });
                return;
            }
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant d'activité requis",
                    code: "MISSING_ACTIVITY_ID",
                });
                return;
            }
            const participation = await ParticipationService.joinActivity(req.userId, id);
            res.status(201).json({
                success: true,
                message: "Demande de participation envoyée",
                participation,
            });
        }
        catch (error) {
            if (error instanceof ParticipationError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors de la demande de participation:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de la demande de participation",
            });
        }
    }
    /**
     * PUT /api/participations/:id/accept
     * Acceptation d'une demande de participation
     */
    static async accept(req, res) {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentification requise",
                    code: "UNAUTHENTICATED",
                });
                return;
            }
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant de participation requis",
                    code: "MISSING_PARTICIPATION_ID",
                });
                return;
            }
            const participation = await ParticipationService.acceptParticipation(id, req.userId);
            res.status(200).json({
                success: true,
                message: "Demande de participation acceptée",
                participation,
            });
        }
        catch (error) {
            if (error instanceof ParticipationError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors de l'acceptation de la participation:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de l'acceptation de la participation",
            });
        }
    }
    /**
     * PUT /api/participations/:id/refuse
     * Refus d'une demande de participation
     */
    static async refuse(req, res) {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentification requise",
                    code: "UNAUTHENTICATED",
                });
                return;
            }
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant de participation requis",
                    code: "MISSING_PARTICIPATION_ID",
                });
                return;
            }
            const participation = await ParticipationService.refuseParticipation(id, req.userId);
            res.status(200).json({
                success: true,
                message: "Demande de participation refusée",
                participation,
            });
        }
        catch (error) {
            if (error instanceof ParticipationError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors du refus de la participation:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors du refus de la participation",
            });
        }
    }
    /**
     * DELETE /api/participations/:id
     * Annulation d'une demande de participation
     */
    static async cancel(req, res) {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: "Authentification requise",
                    code: "UNAUTHENTICATED",
                });
                return;
            }
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant de participation requis",
                    code: "MISSING_PARTICIPATION_ID",
                });
                return;
            }
            await ParticipationService.cancelParticipation(id, req.userId);
            res.status(200).json({
                success: true,
                message: "Demande de participation annulée",
            });
        }
        catch (error) {
            if (error instanceof ParticipationError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors de l'annulation de la participation:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de l'annulation de la participation",
            });
        }
    }
}
//# sourceMappingURL=participation.controller.js.map