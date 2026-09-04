/**
 * Codes d'erreur SQLSTATE Postgres pertinents pour cette API.
 * Référence : https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_NOT_NULL_VIOLATION = "23502";

function readSqlstateCode(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "string" &&
    /^[0-9A-Z]{5}$/.test((value as { code: string }).code)
  ) {
    return (value as { code: string }).code;
  }

  return null;
}

/**
 * Extrait le code SQLSTATE d'une erreur Postgres remontée par `pg`/Drizzle,
 * ou `null` si ce n'en est pas une.
 *
 * Les versions récentes de drizzle-orm enveloppent l'erreur `pg` d'origine
 * dans un `DrizzleQueryError` dont le code SQLSTATE se trouve sur
 * `error.cause`, pas directement sur `error` — on vérifie donc les deux.
 */
export function getPostgresErrorCode(error: unknown): string | null {
  return (
    readSqlstateCode(error) ??
    readSqlstateCode(error instanceof Error ? error.cause : undefined)
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === PG_UNIQUE_VIOLATION;
}
