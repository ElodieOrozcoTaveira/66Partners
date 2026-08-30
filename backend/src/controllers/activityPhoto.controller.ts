import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  ActivityPhotoService,
  ActivityPhotoError,
} from "../services/activityPhoto.services.js";

/**
 * CONTRÔLEUR PHOTOS D'ACTIVITÉ
 *
 * Orchestre les requêtes HTTP liées aux photos souvenirs d'une activité
 * et délègue la logique métier à ActivityPhotoService.
 */
export class ActivityPhotoController {
  /**
   * GET /api/activities/:activityId/photos
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

      const { activityId } = req.params as { activityId: string };
      const photos = await ActivityPhotoService.listPhotos(activityId, req.userId);

      res.status(200).json({ success: true, photos });
    } catch (error) {
      if (error instanceof ActivityPhotoError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la récupération des photos:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des photos",
      });
    }
  }

  /**
   * POST /api/activities/:activityId/photos
   */
  static async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          message: "Aucune image reçue",
          code: "MISSING_FILE",
        });
        return;
      }

      const { activityId } = req.params as { activityId: string };
      const photo = await ActivityPhotoService.addPhoto(
        activityId,
        req.userId,
        `/uploads/${file.filename}`
      );

      res.status(201).json({ success: true, photo });
    } catch (error) {
      if (error instanceof ActivityPhotoError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de l'ajout de la photo:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'ajout de la photo",
      });
    }
  }

  /**
   * DELETE /api/activity-photos/:photoId
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

      const { photoId } = req.params as { photoId: string };
      await ActivityPhotoService.deletePhoto(photoId, req.userId);

      res.status(200).json({ success: true, message: "Photo supprimée" });
    } catch (error) {
      if (error instanceof ActivityPhotoError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la suppression de la photo:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la suppression de la photo",
      });
    }
  }
}
