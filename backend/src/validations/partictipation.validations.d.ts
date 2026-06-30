import { z } from "zod";
/**
 * POST /activities/:id/join
 */
export declare const activityIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
/**
 * PUT /participations/:id/accept, PUT /participations/:id/refuse, DELETE /participations/:id
 */
export declare const participationIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
//# sourceMappingURL=partictipation.validations.d.ts.map