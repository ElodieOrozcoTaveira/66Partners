import { SportService, SportError } from "../services/sport.services.js";
/**
 * CONTRÔLEUR SPORT
 *
 * Orchestre les requêtes HTTP liées à la liste de référence des sports
 * et délègue la logique métier à SportService.
 */
export class SportController {
    /**
     * GET /api/sports
     * Liste de tous les sports
     */
    static async list(req, res) {
        try {
            const sportsList = await SportService.listSports();
            res.status(200).json({ success: true, sports: sportsList });
        }
        catch (error) {
            console.error("Erreur lors de la récupération des sports:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de la récupération des sports",
            });
        }
    }
    /**
     * GET /api/sports/:id
     * Récupération d'un sport par son ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant de sport requis",
                    code: "MISSING_SPORT_ID",
                });
                return;
            }
            const sport = await SportService.getSportById(id);
            if (!sport) {
                res.status(404).json({
                    success: false,
                    message: "Sport non trouvé",
                    code: "SPORT_NOT_FOUND",
                });
                return;
            }
            res.status(200).json({ success: true, sport });
        }
        catch (error) {
            console.error("Erreur lors de la récupération du sport:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de la récupération du sport",
            });
        }
    }
    /**
     * POST /api/sports
     * Création d'un nouveau sport
     */
    static async create(req, res) {
        try {
            const sport = await SportService.createSport(req.body);
            res.status(201).json({
                success: true,
                message: "Sport créé",
                sport,
            });
        }
        catch (error) {
            if (error instanceof SportError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors de la création du sport:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de la création du sport",
            });
        }
    }
    /**
     * PATCH /api/sports/:id
     * Mise à jour d'un sport
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant de sport requis",
                    code: "MISSING_SPORT_ID",
                });
                return;
            }
            const sport = await SportService.updateSport(id, req.body);
            res.status(200).json({
                success: true,
                message: "Sport mis à jour",
                sport,
            });
        }
        catch (error) {
            if (error instanceof SportError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors de la mise à jour du sport:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de la mise à jour du sport",
            });
        }
    }
    /**
     * DELETE /api/sports/:id
     * Suppression d'un sport
     */
    static async remove(req, res) {
        try {
            const { id } = req.params;
            if (typeof id !== "string" || !id) {
                res.status(400).json({
                    success: false,
                    message: "Identifiant de sport requis",
                    code: "MISSING_SPORT_ID",
                });
                return;
            }
            await SportService.deleteSport(id);
            res.status(200).json({
                success: true,
                message: "Sport supprimé",
            });
        }
        catch (error) {
            if (error instanceof SportError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    code: error.code,
                });
                return;
            }
            console.error("Erreur lors de la suppression du sport:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne lors de la suppression du sport",
            });
        }
    }
}
//# sourceMappingURL=sport.controller.js.map