import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  ConversationService,
  ConversationError,
} from "../services/conversation.services.js";

/**
 * CONTRÔLEUR CONVERSATION
 *
 * Orchestre les requêtes HTTP liées aux conversations de groupe
 * et délègue la logique métier à ConversationService.
 */
export class ConversationController {
  /**
   * GET /api/activities/:activityId/conversation
   * Retourne la conversation d'une activité (créée à la volée si absente).
   */
  static async getOrCreate(
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

      const { activityId } = req.params as { activityId: string };

      const conversation = await ConversationService.getOrCreateConversation(
        activityId,
        req.userId
      );

      res.status(200).json({ success: true, conversation });
    } catch (error) {
      if (error instanceof ConversationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la récupération de la conversation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de la conversation",
      });
    }
  }

  /**
   * GET /api/conversations/:id/messages
   * Retourne les messages paginés d'une conversation.
   */
  static async getMessages(
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

      const { id } = req.params as { id: string };
      const limit = Number(req.query.limit as string | undefined) || 50;
      const offset = Number(req.query.offset as string | undefined) || 0;

      const msgs = await ConversationService.getMessages(
        id,
        req.userId,
        limit,
        offset
      );

      res.status(200).json({ success: true, messages: msgs });
    } catch (error) {
      if (error instanceof ConversationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de la récupération des messages:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération des messages",
      });
    }
  }

  /**
   * GET /api/conversations/mine
   * Retourne mes discussions (une par activité créée ou rejointe).
   */
  static async listMine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: "Authentification requise",
          code: "UNAUTHENTICATED",
        });
        return;
      }

      const conversations = await ConversationService.listMine(req.userId);

      res.status(200).json({ success: true, conversations });
    } catch (error) {
      console.error("Erreur lors de la récupération de mes discussions:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la récupération de mes discussions",
      });
    }
  }

  /**
   * POST /api/conversations/:id/messages
   * Envoie un message dans une conversation.
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { contenu } = req.body as { contenu: string };

      const message = await ConversationService.sendMessage(id, req.userId, contenu);

      res.status(201).json({ success: true, message });
    } catch (error) {
      if (error instanceof ConversationError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

      console.error("Erreur lors de l'envoi du message:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de l'envoi du message",
      });
    }
  }
}
