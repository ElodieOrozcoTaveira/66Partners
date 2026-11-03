/**
 * Formatage des dates en heure de Paris, quel que soit le fuseau du
 * téléphone : l'app vise la France et le web applique la même règle
 * (frontend/src/lib/parisDateRange.ts).
 */

const TIME_ZONE = "Europe/Paris";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const isoDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Samedi 25 octobre" */
export function formatActivityDay(date: Date): string {
  return capitalize(dayFormatter.format(date));
}

/** "09:30" */
export function formatActivityTime(date: Date): string {
  return timeFormatter.format(date);
}

/** Différence en jours calendaires (Paris) entre `date` et `now`. */
export function calendarDaysFromNow(date: Date, now: Date = new Date()): number {
  const toUtcMidnight = (value: Date) => {
    const [year, month, day] = isoDayFormatter.format(value).split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };

  return Math.round((toUtcMidnight(date) - toUtcMidnight(now)) / 86_400_000);
}

/** "Aujourd'hui · 18:30", "Demain · 09:00", "Samedi 25 octobre · 10:00" */
export function formatActivityWhen(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const days = calendarDaysFromNow(date, now);
  const time = formatActivityTime(date);

  if (days === 0) return `Aujourd'hui · ${time}`;
  if (days === 1) return `Demain · ${time}`;
  return `${formatActivityDay(date)} · ${time}`;
}

/**
 * Compte à rebours court avant le début : "Dans 25 min", "Dans 3 h",
 * "Demain", "Dans 4 jours", puis la date ; "C'est parti !" une fois commencé.
 */
export function formatStartsIn(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const minutes = Math.floor((date.getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return "C'est parti !";
  if (minutes < 60) return `Dans ${minutes} min`;

  const days = calendarDaysFromNow(date, now);
  if (days === 0) return `Dans ${Math.floor(minutes / 60)} h`;
  if (days === 1) return "Demain";
  if (days < 7) return `Dans ${days} jours`;
  return formatActivityDay(date);
}

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

export type DateFilter = "all" | "today" | "weekend" | "week";

export const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: "Toutes les dates",
  today: "Aujourd'hui",
  weekend: "Ce week-end",
  week: "7 prochains jours",
};

/**
 * Filtre d'affichage (écran Recherche) appliqué à des activités déjà à venir.
 * "Ce week-end" = le prochain samedi/dimanche dans les 7 jours (Paris).
 */
export function matchesDateFilter(isoDate: string, filter: DateFilter, now: Date = new Date()): boolean {
  if (filter === "all") return true;
  const date = new Date(isoDate);
  const days = calendarDaysFromNow(date, now);
  if (filter === "today") return days === 0;
  if (filter === "week") return days >= 0 && days <= 6;
  const weekday = weekdayFormatter.format(date);
  return days >= 0 && days <= 6 && (weekday === "Sat" || weekday === "Sun");
}

/** "à l'instant", "il y a 5 min", "il y a 3 h", "il y a 2 j", puis la date. */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return formatActivityDay(date);
}

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});

/** "octobre 2026" (ex. « Membre depuis octobre 2026 »). */
export function formatMonthYear(isoDate: string): string {
  return monthYearFormatter.format(new Date(isoDate));
}
