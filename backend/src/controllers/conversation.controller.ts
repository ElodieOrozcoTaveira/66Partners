import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import {
  ConversationService,
  ConversationError,
} from "../services/conversation.services.js";
import { TerritoryError } from "../services/territory.services.js";

/**
 * CONTRÔLEUR CONVERSATION
 *
 * Orchestre les requêtes HTTP liées aux conversations de groupe
 * et délègue la logique métier à ConversationService.
 */
export class ConversationController {
  /**
   * GET /api/activities/:activityId/conversation
   * Retourne la conversation de groupe d'une activité (créée à la volée si
   * absente), ou — avec ?carpool=<participantId> — le fil privé covoiturage
   * correspondant (jamais créé ici : uniquement via
   * POST /api/activities/:id/carpool, réservé au participant concerné).
   * `territory` (obligatoire) : territoire actif depuis lequel la
   * conversation est consultée — jamais exposée si différent du territoire
   * réel de l'activité (cf. audit isolation territoriale de la messagerie).
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
      const { carpool, territory } = req.query as { carpool?: string; territory: string };

      const conversation = carpool
        ? await ConversationService.getCarpoolConversation(activityId, carpool, req.userId, territory)
        : await ConversationService.getOrCreateConversation(activityId, req.userId, territory);

      res.status(200).json({ success: true, conversation });
    } catch (error) {
      if (error instanceof ConversationError || error instanceof TerritoryError) {
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
      const { territory } = req.query as { territory: string };
      const limit = Number(req.query.limit as string | undefined) || 50;
      const offset = Number(req.query.offset as string | undefined) || 0;

      const msgs = await ConversationService.getMessages(
        id,
        req.userId,
        territory,
        limit,
        offset
      );

      res.status(200).json({ success: true, messages: msgs });
    } catch (error) {
      if (error instanceof ConversationError || error instanceof TerritoryError) {
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
   * Retourne mes discussions (une par activité créée ou rejointe) du
   * territoire actif uniquement — `territory` obligatoire (cf. audit
   * isolation territoriale de la messagerie, même règle que GET /activities).
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

      const { territory } = req.query as { territory: string };
      const conversations = await ConversationService.listMine(req.userId, territory);

      res.status(200).json({ success: true, conversations });
    } catch (error) {
      if (error instanceof TerritoryError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        });
        return;
      }

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
      const { contenu, territory } = req.body as { contenu: string; territory: string };

      const message = await ConversationService.sendMessage(id, req.userId, contenu, territory);

      res.status(201).json({ success: true, message });
    } catch (error) {
      if (error instanceof ConversationError || error instanceof TerritoryError) {
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
