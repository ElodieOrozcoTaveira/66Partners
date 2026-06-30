import { z } from "zod";
/**
 * POST /sports
 */
export declare const createSportSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export type CreateSportInput = z.infer<typeof createSportSchema>;
/**
 * PATCH /sports/:id
 */
export declare const updateSportSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateSportInput = z.infer<typeof updateSportSchema>;
/**
 * GET /sports/:id, PATCH /sports/:id, DELETE /sports/:id
 */
export declare const sportIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
//# sourceMappingURL=sport.validations.d.ts.map