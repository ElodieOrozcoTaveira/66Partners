import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { NearbyService } from "../services/nearby.services.js";
import type { NearbyInput } from "../validations/nearby.validations.js";

export class NearbyController {
  /**
   * POST /api/nearby
   * Enregistre la position approximative du membre et renvoie le nombre de
   * sportifs autour de lui (jamais leurs positions).
   */
  static async count(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { latitude, longitude } = req.body as NearbyInput;
      const result = await NearbyService.updateAndCount(req.userId!, latitude, longitude);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error("Erreur lors du comptage des sportifs à proximité:", error);
      res.status(500).json({ success: false, message: "Erreur interne" });
    }
  }

  /**
   * DELETE /api/nearby/me
   * Oublie la position du membre.
   */
  static async forget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await NearbyService.forget(req.userId!);
      res.status(204).send();
    } catch (error) {
      console.error("Erreur lors de la suppression de la position:", error);
      res.status(500).json({ success: false, message: "Erreur interne" });
    }
  }
}
