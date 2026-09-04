import type { Response } from "express";
import type { Request } from "express";
import { AvailabilityError, AvailabilityService } from "../services/availability.services.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * CONTRÔLEUR AVAILABILITY
 *
 * Orchestre les requêtes HTTP liées aux créneaux de disponibilité et
 * délègue la logique métier à AvailabilityService.
 */
export class AvailabilityController {
  /**
   * GET /api/users/me/availabilities
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

      const items = await AvailabilityService.listForUser(req.userId);

      res.status(200).json({ success: true, availabilities: items });
    } catch (error) {
      console.error("Erreur lors de la récupération des disponibilités:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des disponibilités",
      });
    }
  }

  /**
   * GET /api/users/:id/availabilities
   */
  static async listForUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const items = await AvailabilityService.listForUser(id);

      res.status(200).json({ success: true, availabilities: items });
    } catch (error) {
      console.error("Erreur lors de la récupération des disponibilités:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des disponibilités",
      });
    }
  }

  /**
   * POST /api/users/me/availabilities
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

      const availability = await AvailabilityService.create(req.userId, req.body);

      res.status(201).json({
        success: true,
        message: "Créneau ajouté",
        availability,
      });
    } catch (error) {
      if (error instanceof AvailabilityError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de l'ajout du créneau:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'ajout du créneau",
      });
    }
  }

  /**
   * DELETE /api/users/me/availabilities/:availabilityId
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

      const { availabilityId } = req.params as { availabilityId: string };
      await AvailabilityService.remove(req.userId, availabilityId);

      res.status(200).json({ success: true, message: "Créneau supprimé" });
    } catch (error) {
      if (error instanceof AvailabilityError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la suppression du créneau:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la suppression du créneau",
      });
    }
  }
}
