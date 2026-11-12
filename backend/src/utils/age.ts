/** Âge minimum pour s'inscrire. */
export const MINIMUM_AGE = 18;

/** Date du jour (AAAA-MM-JJ) à Paris, pour ne pas dépendre du fuseau du serveur. */
function todayInParis(now: Date): { year: number; month: number; day: number } {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  return { year: year!, month: month!, day: day! };
}

/** Date AAAA-MM-JJ réelle (refuse par exemple 2001-02-30). */
export function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m! - 1 && date.getUTCDate() === d;
}

/** Âge en années révolues à la date `now` (jour d'anniversaire compris). */
export function ageOn(birthDate: string, now: Date = new Date()): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const today = todayInParis(now);
  let age = today.year - y!;
  if (today.month < m! || (today.month === m! && today.day < d!)) age -= 1;
  return age;
}
