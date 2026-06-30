import { z } from "zod";
/**
 * POST /auth/register
 */
export declare const registerSchema: z.ZodObject<{
    pseudo: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    city: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
/**
 * POST /auth/login
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
/**
 * PATCH /auth/password
 */
export declare const changePasswordSchema: z.ZodObject<{
    newPassword: z.ZodString;
}, z.core.$strip>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=auth.validations.d.ts.map