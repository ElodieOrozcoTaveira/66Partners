import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
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
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const sportsList = await SportService.listSports();
      res.status(200).json({ success: true, sports: sportsList });
    } catch (error) {
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
  static async getById(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const sport = await SportService.createSport(req.body);

      res.status(201).json({
        success: true,
        message: "Sport créé",
        sport,
      });
    } catch (error) {
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
  static async update(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  static async remove(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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

  /**
   * POST /api/sports/:id/favorite
   * Ajoute ou retire le sport des favoris de l'utilisateur connecté
   */
  static async toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
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
          message: "Identifiant de sport requis",
          code: "MISSING_SPORT_ID",
        });
        return;
      }

      const favorited = await SportService.toggleFavorite(req.userId, id);

      res.status(200).json({
        success: true,
        favorited,
        message: favorited ? "Sport ajouté aux favoris" : "Sport retiré des favoris",
      });
    } catch (error) {
      if (error instanceof SportError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la mise à jour du favori:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la mise à jour du favori",
      });
    }
  }

  /**
   * GET /api/sports/favorites/mine
   * Liste des identifiants de sports favoris de l'utilisateur connecté
   */
  static async listMyFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const sportIds = await SportService.listFavoriteSportIds(req.userId);

      res.status(200).json({ success: true, sportIds });
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des favoris",
      });
    }
  }
}
