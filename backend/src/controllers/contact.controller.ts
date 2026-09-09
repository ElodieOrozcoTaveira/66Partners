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
    // Non-bloquant, comme sendWelcomeEmail/sendResetPasswordEmail
    // (auth.services.ts) : le SMTP (ssl0.ovh.net:465) peut être injoignable
    // depuis certains hébergeurs (port sortant bloqué par défaut, ex.
    // Hetzner) — un await ici ferait alors patienter le client jusqu'au
    // timeout nginx (60s) puis échouer avec un 504, sur TOUTE requête. La
    // confirmation ne garantit donc que la réception du message par
    // l'API, pas la livraison effective de l'email si le port reste bloqué.
    sendContactEmail(req.body).catch((error) => {
      console.error("Erreur lors de l'envoi du message de contact:", error);
    });

    res.status(200).json({
      success: true,
      message: "Votre message a bien été envoyé",
    });
  }
}
