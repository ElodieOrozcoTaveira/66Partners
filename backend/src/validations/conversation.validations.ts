import { z } from "zod";

export const activityIdParamSchema = z.object({
  activityId: z.uuid("Identifiant d'activité invalide"),
});

export const conversationIdParamSchema = z.object({
  id: z.uuid("Identifiant de conversation invalide"),
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
