import type { Request, Response } from "express";
import {
  AdminActivitiesService,
  AdminAuthError,
  AdminAuthService,
  AdminStatsService,
  AdminUsersService,
  type TimeRange,
} from "../services/admin.services.js";
import { UserError } from "../services/user.services.js";

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
   * POST /api/admin/auth/forgot-password
   */
  static async forgotPassword(_req: Request, res: Response): Promise<void> {
    try {
      await AdminAuthService.requestPasswordReset();

      res.status(200).json({
        success: true,
        message: "Un email de réinitialisation vient d'être envoyé.",
      });
    } catch (error) {
      if (error instanceof AdminAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la demande de réinitialisation admin:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la demande de réinitialisation",
      });
    }
  }

  /**
   * POST /api/admin/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body as { token: string; password: string };
      await AdminAuthService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: "Le mot de passe administrateur a été mis à jour avec succès.",
      });
    } catch (error) {
      if (error instanceof AdminAuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la réinitialisation du mot de passe admin:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la réinitialisation du mot de passe",
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

  /**
   * GET /api/admin/users
   */
  static async listUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await AdminUsersService.list();

      res.status(200).json({ success: true, users });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des utilisateurs",
      });
    }
  }

  /**
   * GET /api/admin/activities
   */
  static async listActivities(_req: Request, res: Response): Promise<void> {
    try {
      const activities = await AdminActivitiesService.list();

      res.status(200).json({ success: true, activities });
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des activités",
      });
    }
  }

  /**
   * DELETE /api/admin/users/:userId
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      await AdminUsersService.delete(req.params.userId as string);

      res.status(200).json({ success: true, message: "Compte supprimé" });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la suppression de l'utilisateur",
      });
    }
  }
}
