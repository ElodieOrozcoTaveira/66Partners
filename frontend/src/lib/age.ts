/** Âge minimum pour s'inscrire (contrôlé aussi côté serveur). */
export const MINIMUM_AGE = 18;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Date AAAA-MM-JJ du jour, moins `years` ans (calendrier local). */
export function dateYearsAgo(years: number, now: Date = new Date()): string {
  return `${now.getFullYear() - years}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Âge en années révolues pour une date AAAA-MM-JJ. */
export function ageFrom(birthDate: string, now: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  let age = now.getFullYear() - y!;
  const month = now.getMonth() + 1;
  if (month < m! || (month === m! && now.getDate() < d!)) age -= 1;
  return age;
}

/** Message d'erreur à afficher, ou null si la date convient. */
export function birthDateError(birthDate: string): string | null {
  if (!birthDate) return "Indique ta date de naissance.";
  const age = ageFrom(birthDate);
  if (age === null || age > 120 || age < 0) return "Date de naissance invalide.";
  if (age < MINIMUM_AGE) return "Tu dois avoir au moins 18 ans pour t'inscrire sur la plateforme.";
  return null;
}
