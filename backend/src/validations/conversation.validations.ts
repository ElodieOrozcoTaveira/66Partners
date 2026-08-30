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

export const sendMessageBodySchema = z.object({
  contenu: z
    .string()
    .trim()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Le message est trop long"),
});
