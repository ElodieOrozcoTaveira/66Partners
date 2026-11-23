import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { DiscoveryError, DiscoveryService } from "../services/discovery.services.js";
import type { MapVisibilityInput } from "../validations/discovery.validations.js";

function handleError(res: Response, error: unknown, context: string): void {
  if (error instanceof DiscoveryError) {
    res.status(error.statusCode).json({ success: false, message: error.message, code: error.code });
    return;
  }
  console.error(`Erreur ${context}:`, error);
  res.status(500).json({ success: false, message: "Erreur interne" });
}

export class DiscoveryController {
  /** GET /api/discovery/me : réglage de visibilité du membre (null si invisible). */
  static async getVisibility(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const visibility = await DiscoveryService.getVisibility(req.userId!);
      res.status(200).json({ success: true, visibility });
    } catch (error) {
      handleError(res, error, "lors de la lecture de la visibilité");
    }
  }

  /** PUT /api/discovery/me : apparaître sur la carte, ou changer de secteur. */
  static async enable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { inseeCode, showAge } = req.body as MapVisibilityInput;
      const visibility = await DiscoveryService.enable(req.userId!, { inseeCode, showAge });
      res.status(200).json({ success: true, visibility });
    } catch (error) {
      handleError(res, error, "lors de l'activation de la visibilité");
    }
  }

  /** DELETE /api/discovery/me : disparaître de la carte. */
  static async disable(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await DiscoveryService.disable(req.userId!);
      res.status(204).send();
    } catch (error) {
      handleError(res, error, "lors du retrait de la carte");
    }
  }

  /** GET /api/discovery/members : sportifs visibles autour du membre. */
  static async listMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await DiscoveryService.listAround(req.userId!);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      handleError(res, error, "lors de la lecture de la carte des sportifs");
    }
  }

  /** GET /api/discovery/members/:id : secteur, âge et activités à venir d'un membre. */
  static async getMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await DiscoveryService.getMember(req.userId!, req.params.id as string);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      handleError(res, error, "lors de la lecture du membre");
    }
  }
}
