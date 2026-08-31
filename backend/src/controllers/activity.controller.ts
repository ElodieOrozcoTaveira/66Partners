import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  ActivityService,
  ActivityError,
  type ActivityStatus,
} from "../services/activity.services.js";

/**
 * CONTRÔLEUR ACTIVITÉ
 *
 * Orchestre les requêtes HTTP liées aux activités sportives et délègue
 * la logique métier à ActivityService.
 */
export class ActivityController {
  /**
   * POST /api/activities
   * Création d'une nouvelle activité
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const activity = await ActivityService.createActivity(req.userId, {
        ...req.body,
        startDate: new Date(req.body.startDate),
      });

      res.status(201).json({
        success: true,
        message: "Activité créée",
        activity,
      });
    } catch (error) {
      if (error instanceof ActivityError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la création de l'activité:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la création de l'activité",
      });
    }
  }

  /**
   * GET /api/activities
   * Liste des activités (filtres optionnels : city, sportId, status)
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const { city, sportId, status, participantId, territory } = req.query;

      const filters: Parameters<typeof ActivityService.listActivities>[0] = {};
      if (typeof city === "string") filters.city = city;
      if (typeof sportId === "string") filters.sportId = sportId;
      if (typeof status === "string") filters.status = status as ActivityStatus;
      if (typeof participantId === "string") filters.participantId = participantId;
      if (typeof territory === "string") filters.territory = territory;

      const activitiesList = await ActivityService.listActivities(filters);

      res.status(200).json({ success: true, activities: activitiesList });
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des activités",
      });
    }
  }

  /**
   * GET /api/activities/:id
   * Récupération d'une activité par son ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || !id) {
        res.status(400).json({
          success: false,
          message: "Identifiant d'activité requis",
          code: "MISSING_ACTIVITY_ID",
        });
        return;
      }

      const activity = await ActivityService.getActivityById(id);

      if (!activity) {
        res.status(404).json({
          success: false,
          message: "Activité non trouvée",
          code: "ACTIVITY_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({ success: true, activity });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'activité:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de l'activité",
      });
    }
  }

  /**
   * PATCH /api/activities/:id
   * Mise à jour d'une activité (réservé à son créateur)
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const data = { ...req.body };
      if (data.startDate) {
        data.startDate = new Date(data.startDate);
      }

      const activity = await ActivityService.updateActivity(
        id,
        req.userId,
        data
      );

      res.status(200).json({
        success: true,
        message: "Activité mise à jour",
        activity,
      });
    } catch (error) {
      if (error instanceof ActivityError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la mise à jour de l'activité:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la mise à jour de l'activité",
      });
    }
  }

  /**
   * DELETE /api/activities/:id
   * Suppression d'une activité (réservé à son créateur)
   */
  static async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      await ActivityService.deleteActivity(id, req.userId);

      res.status(200).json({
        success: true,
        message: "Activité supprimée",
      });
    } catch (error) {
      if (error instanceof ActivityError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la suppression de l'activité:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la suppression de l'activité",
      });
    }
  }
}
