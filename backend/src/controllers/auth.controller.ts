import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/auth.services.js";
import { signToken } from "../utils/jwt.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

/**
 * CONTRÔLEUR D'AUTHENTIFICATION
 *
 * Orchestre les requêtes HTTP et délègue la logique métier au service
 */
export class AuthController {
  /**
   * POST /api/auth/register
   * Inscription d'un nouvel utilisateur
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const newUser = await AuthService.registerUser(req.body);
      const token = signToken({ id: newUser.id });

      res.status(201).json({
        success: true,
        message: "Inscription réussie",
        user: newUser,
        token,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de l'inscription:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'inscription",
      });
    }
  }

  /**
   * POST /api/auth/login
   * Connexion d'un utilisateur existant
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.authenticateUser(req.body);
      const token = signToken({ id: user.id });

      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        user,
        token,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la connexion",
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Demande d'envoi d'un email de réinitialisation de mot de passe
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      await AuthService.requestPasswordReset(req.body.email);

      // Réponse volontairement identique que le compte existe ou non
      res.status(200).json({
        success: true,
        message:
          "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.",
      });
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la demande de réinitialisation",
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Finalise la réinitialisation à partir du token reçu par email
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: "Ton mot de passe a été mis à jour avec succès.",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la réinitialisation du mot de passe",
      });
    }
  }

  /**
   * GET /api/auth/me
   * Récupérer le profil de l'utilisateur authentifié (via le token JWT)
   */
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const user = await AuthService.getUserById(req.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération du profil",
      });
    }
  }
}
