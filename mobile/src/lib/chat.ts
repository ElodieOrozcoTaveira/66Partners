import { calendarDaysFromNow, formatActivityTime } from "./date";

/**
 * Utilitaires de la messagerie. Les messages sont gardés du plus récent au
 * plus ancien (ordre renvoyé par l'API et attendu par une liste inversée).
 */

interface Identified {
  id: string;
  createdAt: string;
}

/** Fusionne sans doublon (par id) et trie du plus récent au plus ancien. */
export function mergeMessages<T extends Identified>(current: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>();
  for (const message of current) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id.localeCompare(a.id)
  );
}

const shortDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
});

const longDay = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Heure dans la liste des discussions : "10:24", "Hier", "12/09". */
export function formatConversationTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = calendarDaysFromNow(date, now);
  if (days === 0) return formatActivityTime(date);
  if (days === -1) return "Hier";
  return shortDate.format(date);
}

/** Séparateur de jour dans une discussion : "Aujourd'hui", "Hier", "Samedi 31 octobre". */
export function formatDaySeparator(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = calendarDaysFromNow(date, now);
  if (days === 0) return "Aujourd'hui";
  if (days === -1) return "Hier";
  const label = longDay.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Vrai si les deux dates tombent le même jour (Paris). */
export function isSameDay(a: string, b: string): boolean {
  return calendarDaysFromNow(new Date(a), new Date(b)) === 0;
}
