/**
 * Créneaux de disponibilité : heures murales "HH:mm" (sans date ni fuseau),
 * format attendu par POST /users/me/availabilities.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** Date (sélecteur d'heure) -> "HH:mm", heure locale du téléphone. */
export function toHHMM(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "HH:mm" -> Date du jour à cette heure (valeur initiale du sélecteur). */
export function dateFromHHMM(value: string, base: Date = new Date()): Date {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(base);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** Même contrôle que le serveur : l'heure de fin doit suivre l'heure de début. */
export function validateTimeSlot(startTime: string, endTime: string): string | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
    return "Heure invalide.";
  }
  return startTime < endTime ? null : "L'heure de fin doit être après l'heure de début.";
}
