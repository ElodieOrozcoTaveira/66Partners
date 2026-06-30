import { z } from "zod";
/**
 * PATCH /users/me
 */
export declare const updateUserSchema: z.ZodObject<{
    pseudo: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatar: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    latitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
/**
 * GET /users/:id, GET /users/:id/sports
 */
export declare const userIdParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
/**
 * PUT /users/me/sports
 */
export declare const setUserSportSchema: z.ZodObject<{
    sportId: z.ZodUUID;
    level: z.ZodEnum<{
        BEGINNER: "BEGINNER";
        INTERMEDIATE: "INTERMEDIATE";
        ADVANCED: "ADVANCED";
        EXPERT: "EXPERT";
    }>;
}, z.core.$strip>;
export type SetUserSportInput = z.infer<typeof setUserSportSchema>;
/**
 * DELETE /users/me/sports/:sportId
 */
export declare const userSportIdParamSchema: z.ZodObject<{
    sportId: z.ZodUUID;
}, z.core.$strip>;
//# sourceMappingURL=user.validations.d.ts.map