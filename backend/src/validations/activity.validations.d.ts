import { z } from "zod";
/**
 * POST /activities
 */
export declare const createActivitySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    startDate: z.ZodCoercedDate<unknown>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    levelRequired: z.ZodEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
        EXPERT: "EXPERT";
    }>;
    maxParticipants: z.ZodCoercedNumber<unknown>;
    sportId: z.ZodUUID;
}, z.core.$strip>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
/**
 * PATCH /activities/:id
 */
export declare const updateActivitySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    city: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    levelRequired: z.ZodOptional<z.ZodEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
        EXPERT: "EXPERT";
    }>>;
    maxParticipants: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        CONFIRMED: "CONFIRMED";
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
    }>>;
    sportId: z.ZodOptional<z.ZodUUID>;
}, z.core.$strip>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
/**
 * GET /activities/:id, PATCH /activities/:id, DELETE /activities/:id
 */
export declare const activityIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
/**
 * GET /activities?city=&sportId=&status=
 */
export declare const activityFiltersSchema: z.ZodObject<{
    city: z.ZodOptional<z.ZodString>;
    sportId: z.ZodOptional<z.ZodUUID>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        CONFIRMED: "CONFIRMED";
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
    }>>;
}, z.core.$strip>;
export type ActivityFiltersInput = z.infer<typeof activityFiltersSchema>;
//# sourceMappingURL=activity.validations.d.ts.map