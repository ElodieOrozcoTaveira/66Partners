import { z } from "zod";
import { sportLevelEnum } from "../db/schema.js";
// Validation Zod pour le profil utilisateur
/**
 * PATCH /users/me
 */
export const updateUserSchema = z
    .object({
    pseudo: z.string().trim().min(1, "Le pseudo est requis").max(100),
    city: z.string().trim().min(1).max(100).nullable(),
    bio: z.string().trim().max(2000).nullable(),
    avatar: z.string().trim().max(255).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
})
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: "Aucune donnée à mettre à jour",
});
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
/**
 * DELETE /users/me/sports/:sportId
 */
export const userSportIdParamSchema = z.object({
    sportId: z.uuid("Identifiant de sport invalide"),
});
//# sourceMappingURL=user.validations.js.map