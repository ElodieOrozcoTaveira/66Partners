import { z } from "zod";
import { sanitizeText } from "../utils/sanitize.js";
import { ageOn, isRealDate, MINIMUM_AGE } from "../utils/age.js";

// Validation Zod pour l'authentification

/**
 * POST /auth/register
 */
/** Date de naissance AAAA-MM-JJ, 18 ans révolus (service réservé aux majeurs). */
export const birthDateSchema = z
  .string({ error: "La date de naissance est requise." })
  .trim()
  .refine(isRealDate, "Date de naissance invalide.")
  .refine((value) => ageOn(value) <= 120, "Date de naissance invalide.")
  .refine((value) => ageOn(value) >= MINIMUM_AGE, "Tu dois avoir au moins 18 ans pour t'inscrire sur la plateforme.");

export const registerSchema = z.object({
  pseudo: z.string().trim().min(1, "Le pseudo est requis").max(100).transform(sanitizeText),
  email: z.email("Email invalide").max(255),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128),
  city: z.string().trim().min(1).max(100).transform(sanitizeText).optional(),
  avatar: z.url("URL d'avatar invalide").max(255).optional(),
  // Territoire principal choisi à l'inscription (absent : premier territoire actif).
  birthDate: birthDateSchema,
  territoryCode: z.string().trim().min(1).max(10).optional(),
  // Acceptation explicite requise côté serveur : une valeur absente ou à
  // `false` fait échouer la validation (400), pas de préréglage possible —
  // cf. P1 audit RGPD.
  termsAccepted: z.literal(
    true,
    "Tu dois accepter les Mentions Légales et la Politique de confidentialité pour créer un compte."
  ),
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

export const verifyEmailSchema = z.object({
  token: z.string().min(32, "Lien de confirmation invalide").max(128, "Lien de confirmation invalide"),
});

/**
 * POST /auth/google
 */
export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Jeton Google requis"),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

/**
 * POST /auth/google/complete
 */
export const googleCompleteSchema = z.object({
  credential: z.string().min(1, "Jeton Google requis"),
  birthDate: birthDateSchema,
  territoryCode: z.string().trim().min(1).max(10).optional(),
  // Même exigence que registerSchema : une valeur absente ou à `false` fait
  // échouer la validation (400), jamais de préréglage possible.
  termsAccepted: z.literal(
    true,
    "Tu dois accepter les Mentions Légales et la Politique de confidentialité pour créer un compte."
  ),
});

export type GoogleCompleteInput = z.infer<typeof googleCompleteSchema>;

/**
 * POST /auth/google/link
 */
export const googleLinkSchema = z.object({
  credential: z.string().min(1, "Jeton Google requis"),
});

export type GoogleLinkInput = z.infer<typeof googleLinkSchema>;
