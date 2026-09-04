import { z } from "zod";

/**
 * POST /admin/auth/login
 */
export const adminLoginSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis").max(200),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/**
 * GET /admin/stats/*
 */
export const statsRangeQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
});

export type StatsRangeQuery = z.infer<typeof statsRangeQuerySchema>;
