/**
 * Codes d'erreur SQLSTATE Postgres pertinents pour cette API.
 * Référence : https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_NOT_NULL_VIOLATION = "23502";

/**
 * Extrait le code SQLSTATE d'une erreur Postgres remontée par `pg`/Drizzle,
 * ou `null` si ce n'en est pas une.
 */
export function getPostgresErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    /^[0-9A-Z]{5}$/.test((error as { code: string }).code)
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

export function isUniqueViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === PG_UNIQUE_VIOLATION;
}
