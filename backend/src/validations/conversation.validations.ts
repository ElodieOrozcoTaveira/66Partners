import { z } from "zod";
import { activityFiltersSchema } from "./activity.validations.js";

// Même règle que ActivityFiltersInput.territory (cf. audit P-01) : une
// conversation est toujours consultée dans le contexte d'un territoire actif,
// jamais implicitement "tous territoires" — réutilisation directe du même
// validateur plutôt qu'une redéfinition parallèle.
const territoryCodeSchema = activityFiltersSchema.shape.territory;

export const activityIdParamSchema = z.object({
  activityId: z.uuid("Identifiant d'activité invalide"),
});

// GET /api/activities/:activityId/conversation?carpool=<participantId>&territory=<code>
export const activityConversationQuerySchema = z.object({
  carpool: z.uuid("Identifiant de participant invalide").optional(),
  territory: territoryCodeSchema,
});

export const conversationIdParamSchema = z.object({
  id: z.uuid("Identifiant de conversation invalide"),
});

// GET /api/conversations/mine?territory=<code>
export const listMineQuerySchema = z.object({
  territory: territoryCodeSchema,
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  territory: territoryCodeSchema,
});

export const sendMessageBodySchema = z.object({
  contenu: z
    .string()
    .trim()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Le message est trop long"),
  territory: territoryCodeSchema,
});
