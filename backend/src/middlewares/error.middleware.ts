import type { ErrorRequestHandler, Request, Response } from "express";
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_NOT_NULL_VIOLATION,
  PG_UNIQUE_VIOLATION,
  getPostgresErrorCode,
} from "../utils/db-errors.js";

/**
 * MIDDLEWARES D'ERREUR GLOBAUX
 *
 * - notFoundHandler : capture les routes non trouvées (404)
 * - errorHandler : capture toute erreur non gérée par un contrôleur
 *   (AuthError, UserError, ActivityError, SportError, ParticipationError
 *   exposent toutes `code` et `statusCode`, donc on les reconnaît par duck-typing
 *   plutôt que d'importer chaque classe). Sert aussi de filet de sécurité pour
 *   les erreurs Postgres/Drizzle brutes qui auraient échappé à la traduction
 *   déjà faite au niveau des services (ex. condition de course sur une
 *   contrainte unique), et pour les corps JSON malformés rejetés par
 *   express.json() avant même d'atteindre un contrôleur.
 */

interface KnownError extends Error {
  statusCode: number;
  code: string;
}

function isKnownError(error: unknown): error is KnownError {
  return (
    error instanceof Error &&
    typeof (error as Partial<KnownError>).statusCode === "number" &&
    typeof (error as Partial<KnownError>).code === "string"
  );
}

const POSTGRES_ERROR_RESPONSES: Record<
  string,
  { statusCode: number; code: string; message: string }
> = {
  [PG_UNIQUE_VIOLATION]: {
    statusCode: 409,
    code: "DUPLICATE_ENTRY",
    message: "Cette ressource existe déjà",
  },
  [PG_FOREIGN_KEY_VIOLATION]: {
    statusCode: 400,
    code: "INVALID_REFERENCE",
    message: "Référence invalide : la ressource liée n'existe pas",
  },
  [PG_NOT_NULL_VIOLATION]: {
    statusCode: 400,
    code: "MISSING_REQUIRED_FIELD",
    message: "Champ requis manquant",
  },
};

function isJsonParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    "body" in error
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route non trouvée : ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isKnownError(error)) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
    return;
  }

  if (isJsonParseError(error)) {
    res.status(400).json({
      success: false,
      message: "Corps de requête JSON invalide",
      code: "INVALID_JSON",
    });
    return;
  }

  const pgErrorCode = getPostgresErrorCode(error);
  const pgResponse = pgErrorCode ? POSTGRES_ERROR_RESPONSES[pgErrorCode] : undefined;

  if (pgResponse) {
    res.status(pgResponse.statusCode).json({
      success: false,
      message: pgResponse.message,
      code: pgResponse.code,
    });
    return;
  }

  console.error("❌ Erreur non gérée:", error);
  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
  });
};
