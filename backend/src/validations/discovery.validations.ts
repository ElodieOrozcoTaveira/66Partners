import { z } from "zod";

/**
 * PUT /discovery/me — code INSEE de la commune choisie (la Corse utilise 2A/2B).
 * Le consentement doit être explicite : `consent` vaut obligatoirement true.
 */
export const mapVisibilitySchema = z.object({
  inseeCode: z.string().regex(/^(\d{5}|2[AB]\d{3})$/, "Code commune invalide"),
  showAge: z.boolean().default(false),
  consent: z.literal(true),
}).strict();

export type MapVisibilityInput = z.infer<typeof mapVisibilitySchema>;
