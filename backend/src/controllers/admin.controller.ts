import type { Request, Response } from "express";
import { AdminAuthError, AdminAuthService, AdminStatsService, type TimeRange } from "../services/admin.services.js";

/**
 * CONTRÔLEUR ADMIN
 *
 * Orchestre les requêtes HTTP de l'espace admin et délègue la logique
 * métier à AdminAuthService / AdminStatsService.
 */
export class AdminController {
  /**
   * POST /api/admin/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body as { password: string };
      const token = await AdminAuthService.login(password, req.ip ?? "unknown");

      res.status(200).json({ success: true, token });
    } catch (error) {
      if (error instanceof AdminAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la connexion admin:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la connexion admin",
      });
    }
  }

  /**
   * GET /api/admin/stats/overview
   */
  static async statsOverview(req: Request, res: Response): Promise<void> {
    try {
      const { range } = req.query as unknown as { range: TimeRange };
      const overview = await AdminStatsService.getOverview(range);

      res.status(200).json({ success: true, overview });
    } catch (error) {
      console.error("Erreur lors de la récupération de la vue d'ensemble:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de la vue d'ensemble",
      });
    }
  }

  /**
   * GET /api/admin/stats/user-evolution
   */
  static async userEvolution(req: Request, res: Response): Promise<void> {
    try {
      const { range } = req.query as unknown as { range: TimeRange };
      const points = await AdminStatsService.getUserEvolution(range);

      res.status(200).json({ success: true, points });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'évolution des utilisateurs:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de l'évolution des utilisateurs",
      });
    }
  }

  /**
   * GET /api/admin/stats/territory-breakdown
   */
  static async territoryBreakdown(_req: Request, res: Response): Promise<void> {
    try {
      const items = await AdminStatsService.getTerritoryBreakdown();

      res.status(200).json({ success: true, items });
    } catch (error) {
      console.error("Erreur lors de la récupération de la répartition par territoire:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de la répartition par territoire",
      });
    }
  }
}
