import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { UserService, UserError } from "../services/user.services.js";

/**
 * CONTRÔLEUR UTILISATEUR
 *
 * Orchestre les requêtes HTTP liées au profil utilisateur et délègue
 * la logique métier à UserService.
 */
export class UserController {
  /**
   * GET /api/users/me
   * Récupérer le profil de l'utilisateur authentifié
   */
  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const user = await UserService.getUserById(req.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération du profil",
      });
    }
  }

  /**
   * GET /api/users/:id
   * Récupérer le profil public d'un utilisateur
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || !id) {
        res.status(400).json({
          success: false,
          message: "Identifiant utilisateur requis",
          code: "MISSING_USER_ID",
        });
        return;
      }

      const user = await UserService.getPublicUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de l'utilisateur",
      });
    }
  }

  /**
   * PATCH /api/users/me
   * Mettre à jour le profil de l'utilisateur authentifié
   */
  static async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const updatedUser = await UserService.updateUser(req.userId, req.body);

      res.status(200).json({
        success: true,
        message: "Profil mis à jour",
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la mise à jour du profil:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la mise à jour du profil",
      });
    }
  }

  /**
   * POST /api/users/me/avatar
   * Uploader la photo de profil de l'utilisateur authentifié
   */
  static async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const updatedUser = await UserService.updateUser(req.userId, {
        avatar: `/uploads/${file.filename}`,
      });

      res.status(200).json({
        success: true,
        message: "Photo de profil mise à jour",
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de l'upload de la photo de profil:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'upload de la photo de profil",
      });
    }
  }

  /**
   * POST /api/users/me/cover-photo
   * Uploader la photo de couverture de l'utilisateur authentifié
   */
  static async uploadCoverPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const updatedUser = await UserService.updateUser(req.userId, {
        coverPhoto: `/uploads/${file.filename}`,
      });

      res.status(200).json({
        success: true,
        message: "Photo de couverture mise à jour",
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de l'upload de la photo de couverture:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'upload de la photo de couverture",
      });
    }
  }

  /**
   * DELETE /api/users/me
   * Supprimer le compte de l'utilisateur authentifié
   */
  static async deleteMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      await UserService.deleteUser(req.userId);

      res.status(200).json({
        success: true,
        message: "Compte supprimé",
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la suppression du compte:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la suppression du compte",
      });
    }
  }

  /**
   * GET /api/users/me/sports
   * Lister les sports pratiqués par l'utilisateur authentifié
   */
  static async listMySports(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const userSports = await UserService.listUserSports(req.userId);

      res.status(200).json({ success: true, sports: userSports });
    } catch (error) {
      console.error("Erreur lors de la récupération des sports pratiqués:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des sports pratiqués",
      });
    }
  }

  /**
   * GET /api/users/:id/sports
   * Lister les sports pratiqués par un utilisateur (profil public)
   */
  static async listUserSports(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || !id) {
        res.status(400).json({
          success: false,
          message: "Identifiant utilisateur requis",
          code: "MISSING_USER_ID",
        });
        return;
      }

      const userSports = await UserService.listUserSports(id);

      res.status(200).json({ success: true, sports: userSports });
    } catch (error) {
      console.error("Erreur lors de la récupération des sports pratiqués:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des sports pratiqués",
      });
    }
  }

  /**
   * PUT /api/users/me/sports
   * Ajouter ou mettre à jour un sport pratiqué par l'utilisateur authentifié
   */
  static async setMySport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { sportId, level } = req.body;
      const userSport = await UserService.setUserSport(req.userId, sportId, level);

      res.status(200).json({
        success: true,
        message: "Sport mis à jour",
        sport: userSport,
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la mise à jour du sport pratiqué:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la mise à jour du sport pratiqué",
      });
    }
  }

  /**
   * DELETE /api/users/me/sports/:sportId
   * Retirer un sport pratiqué par l'utilisateur authentifié
   */
  static async removeMySport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const { sportId } = req.params;

      if (typeof sportId !== "string" || !sportId) {
        res.status(400).json({
          success: false,
          message: "Identifiant de sport requis",
          code: "MISSING_SPORT_ID",
        });
        return;
      }

      await UserService.removeUserSport(req.userId, sportId);

      res.status(200).json({
        success: true,
        message: "Sport retiré",
      });
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors du retrait du sport pratiqué:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors du retrait du sport pratiqué",
      });
    }
  }
}
