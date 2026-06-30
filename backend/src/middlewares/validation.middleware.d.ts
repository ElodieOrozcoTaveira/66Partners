import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
/**
 * MIDDLEWARE GÉNÉRIQUE DE VALIDATION ZOD
 *
 * Permet de valider req.body, req.params, req.query avec n'importe quel schéma Zod
 */
interface ValidationSchemas {
    body?: z.ZodSchema<any>;
    params?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
}
/**
 * Crée un middleware de validation générique
 * @param schemas - Schémas de validation pour body, params, query
 * @returns Middleware Express
 */
export declare const validate: (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware pour valider seulement le body
 */
export declare const validateBody: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware pour valider seulement les params
 */
export declare const validateParams: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware pour valider seulement la query
 */
export declare const validateQuery: (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * SCHÉMAS COMMUNS RÉUTILISABLES
 */
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodUUID;
}, z.core.$strip>;
export declare const paginationQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export {};
/**
 * UTILISATION EXEMPLE :
 *
 * import { validate, validateBody, idParamSchema } from './validationMiddleware';
 * import { createNoticeSchema } from '../validation/noticeValidation';
 *
 * // Validation complète
 * router.post('/:id', validate({
 *   params: idParamSchema,
 *   body: createNoticeSchema,
 *   query: paginationQuerySchema
 * }), controller.method);
 *
 * // Validation simple du body
 * router.post('/', validateBody(createNoticeSchema), controller.create);
 */ 
//# sourceMappingURL=validation.middleware.d.ts.map