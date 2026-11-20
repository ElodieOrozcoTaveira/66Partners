import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { PushService } from "../services/push.services.js";
import type { PushSubscribeInput, PushUnsubscribeInput } from "../validations/push.validations.js";

/**
 * CONTRÔLEUR PUSH
 *
 * Gère l'abonnement/désabonnement aux notifications push (Web Push). Ces
 * routes ne font qu'exécuter le choix explicite de l'utilisateur — le
 * consentement (clic sur "Activer") est géré côté frontend, jamais ici.
 */
export class PushController {
  /**
   * GET /api/push/vapid-public-key
   * Clé publique VAPID (non sensible par nature) nécessaire à `pushManager.subscribe()`.
   */
  static async getVapidPublicKey(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const publicKey = PushService.getPublicKey();
    if (!publicKey) {
      res.status(503).json({
        success: false,
        message: "Les notifications push ne sont pas configurées sur ce serveur",
      });
      return;
    }
    res.status(200).json({ success: true, publicKey });
  }

  /**
   * POST /api/push/subscribe
   */
  static async subscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { endpoint, keys } = req.body as PushSubscribeInput;
      await PushService.subscribe(req.userId, { endpoint, keys });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Erreur lors de l'abonnement push:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'abonnement aux notifications push",
      });
    }
  }

  /**
   * POST /api/push/unsubscribe
   */
  static async unsubscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { endpoint } = req.body as PushUnsubscribeInput;
      await PushService.unsubscribe(req.userId, endpoint);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur lors du désabonnement push:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors du désabonnement des notifications push",
      });
    }
  }

  /**
   * POST /api/admin/push/subscribe (requireAdminAuth)
   * Abonne CET appareil aux alertes admin (nouvelle inscription...).
   */
  static async adminSubscribe(req: Request, res: Response): Promise<void> {
    try {
      const { endpoint, keys } = req.body as PushSubscribeInput;
      await PushService.subscribeAdmin({ endpoint, keys });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Erreur lors de l'abonnement push admin:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'activation des alertes admin",
      });
    }
  }

  /**
   * POST /api/admin/push/unsubscribe (requireAdminAuth)
   * Retire l'appareil des alertes admin SANS révoquer l'abonnement navigateur
   * (il peut servir aussi aux notifications membre sur le même téléphone).
   */
  static async adminUnsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const { endpoint } = req.body as PushUnsubscribeInput;
      await PushService.unsubscribeAdmin(endpoint);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur lors du désabonnement push admin:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la désactivation des alertes admin",
      });
    }
  }
}
