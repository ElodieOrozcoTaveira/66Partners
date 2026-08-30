import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { NotificationService } from "../services/notification.services.js";

/**
 * CONTRÔLEUR NOTIFICATIONS
 *
 * Orchestre les requêtes HTTP liées aux notifications utilisateur.
 */
export class NotificationController {
  /**
   * GET /api/notifications
   * Liste mes notifications (les plus récentes en premier) + le nombre non lu.
   */
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const [items, unreadCount] = await Promise.all([
        NotificationService.listMine(req.userId),
        NotificationService.getUnreadCount(req.userId),
      ]);

      res.status(200).json({ success: true, notifications: items, unreadCount });
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des notifications",
      });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marque une notification comme lue.
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { id } = req.params as { id: string };
      await NotificationService.markAsRead(id, req.userId);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors du marquage de la notification",
      });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Marque toutes mes notifications comme lues.
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      await NotificationService.markAllAsRead(req.userId);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors du marquage des notifications",
      });
    }
  }
}
