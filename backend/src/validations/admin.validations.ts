import { z } from "zod";

/**
 * POST /admin/auth/login
 */
export const adminLoginSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis").max(200),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/**
 * POST /admin/auth/reset-password
 */
export const adminResetPasswordSchema = z.object({
  token: z.string().min(1, "Lien de réinitialisation invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128),
});

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

/**
 * GET /admin/stats/*
 */
export const statsRangeQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
  // Filtre territoire optionnel (absent = tous les territoires).
  territory: z.string().trim().min(1).max(10).optional(),
});

/**
 * GET /admin/users, GET /admin/activities
 */
export const adminTerritoryQuerySchema = z.object({
  territory: z.string().trim().min(1).max(10).optional(),
});

export type StatsRangeQuery = z.infer<typeof statsRangeQuerySchema>;

/**
 * DELETE /admin/users/:userId
 */
export const adminUserIdParamSchema = z.object({
  userId: z.uuid("Identifiant utilisateur invalide"),
});
