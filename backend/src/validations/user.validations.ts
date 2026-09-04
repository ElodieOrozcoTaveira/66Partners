import { z } from "zod";
import { sportLevelEnum } from "../db/schema.js";
import { sanitizeText } from "../utils/sanitize.js";

// Validation Zod pour le profil utilisateur

/**
 * PATCH /users/me
 */
export const updateUserSchema = z
  .object({
    pseudo: z.string().trim().min(1, "Le pseudo est requis").max(100).transform(sanitizeText),
    city: z.string().trim().min(1).max(100).transform(sanitizeText).nullable(),
    headline: z.string().trim().max(200).transform(sanitizeText).nullable(),
    lookingFor: z.string().trim().max(200).transform(sanitizeText).nullable(),
    openTo: z.string().trim().max(200).transform(sanitizeText).nullable(),
    avatar: z.url("URL d'avatar invalide").max(255).nullable(),
    coverPhoto: z.url("URL de couverture invalide").max(255).nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucune donnée à mettre à jour",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * GET /users/:id, GET /users/:id/sports
 */
export const userIdParamSchema = z.object({
  id: z.uuid("Identifiant utilisateur invalide"),
});

/**
 * PUT /users/me/sports
 */
export const setUserSportSchema = z.object({
  sportId: z.uuid("Identifiant de sport invalide"),
  level: z.enum(sportLevelEnum.enumValues),
});

export type SetUserSportInput = z.infer<typeof setUserSportSchema>;

/**
 * DELETE /users/me/sports/:sportId
 */
export const userSportIdParamSchema = z.object({
  sportId: z.uuid("Identifiant de sport invalide"),
});
