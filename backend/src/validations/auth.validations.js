import { z } from "zod";
// Validation Zod pour l'authentification
/**
 * POST /auth/register
 */
export const registerSchema = z.object({
    pseudo: z.string().trim().min(1, "Le pseudo est requis").max(100),
    email: z.email("Email invalide").max(255),
    password: z
        .string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .max(128),
    city: z.string().trim().min(1).max(100).optional(),
    bio: z.string().trim().max(2000).optional(),
    avatar: z.string().trim().max(255).optional(),
});
/**
 * POST /auth/login
 */
export const loginSchema = z.object({
    email: z.email("Email invalide"),
    password: z.string().min(1, "Le mot de passe est requis"),
});
/**
 * PATCH /auth/password
 */
export const changePasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .max(128),
});
//# sourceMappingURL=auth.validations.js.map