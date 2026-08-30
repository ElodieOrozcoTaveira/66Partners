import { z } from "zod";
import { activitiesStatusEnum, sportLevelEnum } from "../db/schema.js";
import { sanitizeText } from "../utils/sanitize.js";

// Validation Zod pour les activités

const levelRequiredSchema = z.enum(sportLevelEnum.enumValues);
const statusSchema = z.enum(activitiesStatusEnum.enumValues);

const futureDate = z.coerce.date().refine((date) => date.getTime() > Date.now(), {
  message: "La date de l'activité doit être dans le futur",
});

/**
 * POST /activities
 */
export const createActivitySchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(150).transform(sanitizeText),
  description: z.string().trim().max(2000).transform(sanitizeText).optional(),
  city: z.string().trim().min(1, "La ville est requise").max(100).transform(sanitizeText),
  startDate: futureDate,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  levelRequired: levelRequiredSchema,
  maxParticipants: z.coerce
    .number()
    .int()
    .gt(1, "Le nombre maximum de participants doit être supérieur à 1"),
  sportId: z.uuid("Identifiant de sport invalide"),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

/**
 * PATCH /activities/:id
 */
export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(1).max(150).transform(sanitizeText),
    description: z.string().trim().max(2000).transform(sanitizeText).nullable(),
    city: z.string().trim().min(1).max(100).transform(sanitizeText),
    startDate: futureDate,
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    levelRequired: levelRequiredSchema,
    maxParticipants: z.coerce
      .number()
      .int()
      .gt(1, "Le nombre maximum de participants doit être supérieur à 1"),
    status: statusSchema,
    sportId: z.uuid("Identifiant de sport invalide"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucune donnée à mettre à jour",
  });

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

/**
 * GET /activities/:id, PATCH /activities/:id, DELETE /activities/:id
 */
export const activityIdParamSchema = z.object({
  id: z.uuid("Identifiant d'activité invalide"),
});

/**
 * GET /activities?city=&sportId=&status=
 */
export const activityFiltersSchema = z.object({
  city: z.string().trim().min(1).optional(),
  sportId: z.uuid("Identifiant de sport invalide").optional(),
  status: statusSchema.optional(),
  participantId: z.uuid("Identifiant de participant invalide").optional(),
});

export type ActivityFiltersInput = z.infer<typeof activityFiltersSchema>;
