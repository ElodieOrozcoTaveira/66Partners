import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/auth.services.js";
import { verifyGoogleCredential } from "../services/google.services.js";
import { verifyFacebookAccessToken } from "../services/facebook.services.js";
import { SocialAuthError } from "../services/socialAuthError.js";
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

  /**
   * POST /api/auth/google
   * Constate l'état d'un compte Google (connecté / nouveau / email déjà pris)
   * — ne crée et ne fusionne jamais rien (cf. AuthService.loginWithGoogle).
   */
  static async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      const profile = await verifyGoogleCredential(credential);
      const result = await AuthService.loginWithGoogle(profile);

      if (result.status === "LOGGED_IN") {
        const token = signToken({ id: result.user.id });
        res.status(200).json({
          success: true,
          status: "LOGGED_IN",
          message: "Connexion réussie",
          user: result.user,
          token,
        });
        return;
      }

      res.status(200).json({ success: true, status: result.status, email: result.email });
    } catch (error) {
      AuthController.handleSocialAuthError(
        error,
        res,
        "Erreur lors de l'authentification Google",
        "l'authentification Google"
      );
    }
  }

  /**
   * POST /api/auth/google/complete
   * Seule voie de création d'un compte Google — exige termsAccepted=true
   * (déjà revalidé par Zod avant ce handler).
   */
  static async googleComplete(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      const profile = await verifyGoogleCredential(credential);
      const newUser = await AuthService.completeGoogleSignup(profile, true);
      const token = signToken({ id: newUser.id });

      res.status(201).json({
        success: true,
        message: "Inscription réussie",
        user: newUser,
        token,
      });
    } catch (error) {
      AuthController.handleSocialAuthError(
        error,
        res,
        "Erreur lors de l'inscription avec Google",
        "l'inscription avec Google"
      );
    }
  }

  /**
   * POST /api/auth/google/link
   * Associe Google au compte déjà authentifié (req.userId, requireAuth) —
   * jamais de fusion automatique par email seul.
   */
  static async googleLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { credential } = req.body;
      const profile = await verifyGoogleCredential(credential);
      await AuthService.linkGoogleAccount(req.userId, profile);

      res.status(200).json({ success: true, message: "Compte Google associé." });
    } catch (error) {
      AuthController.handleSocialAuthError(
        error,
        res,
        "Erreur lors de l'association du compte Google",
        "l'association du compte Google"
      );
    }
  }

  /**
   * POST /api/auth/facebook
   * Constate l'état d'un compte Facebook (connecté / nouveau / email déjà pris)
   * — ne crée et ne fusionne jamais rien (cf. AuthService.loginWithFacebook).
   */
  static async facebookAuth(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken } = req.body;
      const profile = await verifyFacebookAccessToken(accessToken);
      const result = await AuthService.loginWithFacebook(profile);

      if (result.status === "LOGGED_IN") {
        const token = signToken({ id: result.user.id });
        res.status(200).json({
          success: true,
          status: "LOGGED_IN",
          message: "Connexion réussie",
          user: result.user,
          token,
        });
        return;
      }

      res.status(200).json({ success: true, status: result.status, email: result.email });
    } catch (error) {
      AuthController.handleSocialAuthError(
        error,
        res,
        "Erreur lors de l'authentification Facebook",
        "l'authentification Facebook"
      );
    }
  }

  /**
   * POST /api/auth/facebook/complete
   * Seule voie de création d'un compte Facebook — exige termsAccepted=true
   * (déjà revalidé par Zod avant ce handler).
   */
  static async facebookComplete(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken } = req.body;
      const profile = await verifyFacebookAccessToken(accessToken);
      const newUser = await AuthService.completeFacebookSignup(profile, true);
      const token = signToken({ id: newUser.id });

      res.status(201).json({
        success: true,
        message: "Inscription réussie",
        user: newUser,
        token,
      });
    } catch (error) {
      AuthController.handleSocialAuthError(
        error,
        res,
        "Erreur lors de l'inscription avec Facebook",
        "l'inscription avec Facebook"
      );
    }
  }

  /**
   * POST /api/auth/facebook/link
   * Associe Facebook au compte déjà authentifié (req.userId, requireAuth) —
   * jamais de fusion automatique par email seul.
   */
  static async facebookLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { accessToken } = req.body;
      const profile = await verifyFacebookAccessToken(accessToken);
      await AuthService.linkFacebookAccount(req.userId, profile);

      res.status(200).json({ success: true, message: "Compte Facebook associé." });
    } catch (error) {
      AuthController.handleSocialAuthError(
        error,
        res,
        "Erreur lors de l'association du compte Facebook",
        "l'association du compte Facebook"
      );
    }
  }

  // Jamais logger `req.body`/le jeton du provider — uniquement le message de
  // l'erreur, cf. audit sécurité Google, étendu à Facebook.
  private static handleSocialAuthError(
    error: unknown,
    res: Response,
    logPrefix: string,
    actionLabel: string
  ): void {
    if (error instanceof SocialAuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    console.error(logPrefix + ":", error instanceof Error ? error.message : "erreur inconnue");
    res.status(500).json({
      success: false,
      message: `Erreur interne lors de ${actionLabel}`,
    });
  }
}
