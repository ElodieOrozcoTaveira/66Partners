import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { TerritoryService, TerritoryError } from "../services/territory.services.js";

/**
 * CONTRÔLEUR TERRITORY
 *
 * Orchestre les requêtes HTTP liées aux territoires et délègue
 * la logique métier à TerritoryService.
 */
export class TerritoryController {
  /**
   * GET /api/territories
   * Liste de tous les territoires
   */
  static async list(_req: Request, res: Response): Promise<void> {
    try {
      const territoriesList = await TerritoryService.listTerritories();

      res.status(200).json({ success: true, territories: territoriesList });
    } catch (error) {
      console.error("Erreur lors de la récupération des territoires:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des territoires",
      });
    }
  }

  /**
   * GET /api/territories/:code
   * Récupération d'un territoire par son code
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params as { code: string };
      const territory = await TerritoryService.getByCode(code);

      res.status(200).json({ success: true, territory });
    } catch (error) {
      if (error instanceof TerritoryError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la récupération du territoire:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération du territoire",
      });
    }
  }

  /**
   * GET /api/territories/mine
   * Territoires de l'utilisateur authentifié
   */
  static async listMine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const territoriesList = await TerritoryService.listForUser(req.userId);

      res.status(200).json({ success: true, territories: territoriesList });
    } catch (error) {
      console.error("Erreur lors de la récupération des territoires de l'utilisateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des territoires",
      });
    }
  }

  /**
   * POST /api/territories/:code/join
   * Rattachement de l'utilisateur authentifié à un territoire supplémentaire
   */
  static async join(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { code } = req.params as { code: string };
      const territory = await TerritoryService.joinTerritory(req.userId, code);

      res.status(200).json({ success: true, territory });
    } catch (error) {
      if (error instanceof TerritoryError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors du rattachement au territoire:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors du rattachement au territoire",
      });
    }
  }
}
