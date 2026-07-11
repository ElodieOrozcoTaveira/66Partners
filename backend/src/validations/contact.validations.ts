import { z } from "zod";
import { sanitizeText } from "../utils/sanitize.js";

// Validation Zod pour le formulaire de contact

/**
 * POST /contact
 */
export const createContactSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100).transform(sanitizeText),
  email: z.email("Email invalide").max(255),
  message: z.string().trim().min(1, "Le message est requis").max(2000).transform(sanitizeText),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
