import type { Request, Response } from "express";
import { sendContactEmail } from "../services/mail.services.js";

/**
 * CONTRÔLEUR CONTACT
 *
 * Reçoit les messages du formulaire de contact public et les transmet par email.
 */
export class ContactController {
  /**
   * POST /api/contact
   */
  static async send(req: Request, res: Response): Promise<void> {
    try {
      await sendContactEmail(req.body);
      res.status(200).json({
        success: true,
        message: "Votre message a bien été envoyé",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du message de contact:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi du message",
      });
    }
  }
}
