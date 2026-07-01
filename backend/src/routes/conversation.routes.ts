import { Router } from "express";
import { ConversationController } from "../controllers/conversation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  activityIdParamSchema,
  conversationIdParamSchema,
  messagesQuerySchema,
} from "../validations/conversation.validations.js";

/*
GET /api/activities/:activityId/conversation  — conversation d'une activité
GET /api/conversations/:id/messages           — messages paginés
*/

const activityConversationRouter = Router({ mergeParams: true });
const conversationRouter = Router();

// Monté sur /api/activities
activityConversationRouter.get(
  "/:activityId/conversation",
  requireAuth,
  validate({ params: activityIdParamSchema }),
  ConversationController.getOrCreate
);

// Monté sur /api/conversations
conversationRouter.get(
  "/:id/messages",
  requireAuth,
  validate({ params: conversationIdParamSchema, query: messagesQuerySchema }),
  ConversationController.getMessages
);

export { activityConversationRouter, conversationRouter };
