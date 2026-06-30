import { z } from "zod";
// Validation Zod pour les sports
/**
 * POST /sports
 */
export const createSportSchema = z.object({
    name: z.string().trim().min(1, "Le nom du sport est requis").max(100),
});
/**
 * PATCH /sports/:id
 */
export const updateSportSchema = z
    .object({
    name: z.string().trim().min(1, "Le nom du sport est requis").max(100),
})
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
    message: "Aucune donnée à mettre à jour",
});
/**
 * GET /sports/:id, PATCH /sports/:id, DELETE /sports/:id
 */
export const sportIdParamSchema = z.object({
    id: z.uuid("Identifiant de sport invalide"),
});
//# sourceMappingURL=sport.validations.js.map