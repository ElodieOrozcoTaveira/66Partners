import { z } from "zod";
import { sanitizeText } from "../utils/sanitize.js";

// Validation Zod pour l'authentification

/**
 * POST /auth/register
 */
export const registerSchema = z.object({
  pseudo: z.string().trim().min(1, "Le pseudo est requis").max(100).transform(sanitizeText),
  email: z.email("Email invalide").max(255),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128),
  city: z.string().trim().min(1).max(100).transform(sanitizeText).optional(),
  bio: z.string().trim().max(2000).transform(sanitizeText).optional(),
  avatar: z.url("URL d'avatar invalide").max(255).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * POST /auth/login
 */
export const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * PATCH /auth/password
 */
export const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * POST /auth/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: z.email("Email invalide"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * POST /auth/reset-password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Lien de réinitialisation invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
