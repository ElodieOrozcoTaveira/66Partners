import { z } from "zod";

// Validation Zod pour les territoires

/**
 * GET /territories/:code
 */
export const territoryCodeParamSchema = z.object({
  code: z.string().trim().min(1, "Code de territoire requis").max(10),
});
