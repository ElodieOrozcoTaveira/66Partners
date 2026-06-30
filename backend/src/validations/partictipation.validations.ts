import { z } from "zod";

// Validation Zod pour les participations
// (les actions de participation ne prennent pas de corps de requête,
// seulement des identifiants en paramètre d'URL)

/**
 * POST /activities/:id/join
 */
export const activityIdParamSchema = z.object({
  id: z.uuid("Identifiant d'activité invalide"),
});

/**
 * PUT /participations/:id/accept, PUT /participations/:id/refuse, DELETE /participations/:id
 */
export const participationIdParamSchema = z.object({
  id: z.uuid("Identifiant de participation invalide"),
});
