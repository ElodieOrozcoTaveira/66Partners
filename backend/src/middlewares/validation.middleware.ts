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
export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validation du body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validation des paramètres
      if (schemas.params) {
        Object.assign(req.params, schemas.params.parse(req.params));
      }

      // Validation de la query string
      if (schemas.query) {
        Object.assign(req.query, schemas.query.parse(req.query));
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
        });
        return;
      }

      // Erreur inattendue
      console.error("❌ Erreur de validation inattendue:", error);
      res.status(500).json({
        success: false,
        message: "Erreur interne lors de la validation",
      });
    }
  };
};

/**
 * Middleware pour valider seulement le body
 */
export const validateBody = (schema: z.ZodSchema<any>) => {
  return validate({ body: schema });
};

/**
 * Middleware pour valider seulement les params
 */
export const validateParams = (schema: z.ZodSchema<any>) => {
  return validate({ params: schema });
};

/**
 * Middleware pour valider seulement la query
 */
export const validateQuery = (schema: z.ZodSchema<any>) => {
  return validate({ query: schema });
};

/**
 * SCHÉMAS COMMUNS RÉUTILISABLES
 */

// ID (UUID) dans les paramètres — tous les identifiants du schéma Drizzle sont des uuid
export const idParamSchema = z.object({
  id: z.uuid("ID doit être un UUID valide"),
});

// Pagination dans la query
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
});

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