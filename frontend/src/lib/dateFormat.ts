const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const weekdayLongFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatWeekday(date: Date): string {
  return weekdayFormatter.format(date).replace(".", "").toUpperCase();
}

export function formatMonth(date: Date): string {
  return monthFormatter.format(date).replace(".", "").toUpperCase();
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

/** Ex. "Jeudi" */
export function formatWeekdayLong(date: Date): string {
  return capitalize(weekdayLongFormatter.format(date));
}

/** Ex. "Sam." */
export function formatWeekdayShort(date: Date): string {
  return capitalize(weekdayFormatter.format(date));
}

/** Ex. "25 mai" */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${monthFormatter.format(date)}`;
}

const dayMonthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Ex. "22 août 2026" */
export function formatDayMonthYear(date: Date): string {
  return dayMonthYearFormatter.format(date);
}

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

/** Ex. "Juin 2025" */
export function formatMonthYear(date: Date): string {
  return capitalize(monthYearFormatter.format(date));
}

/** Ex. "Aujourd'hui", "Demain", "Dans 4 jours" */
export function formatRelativeDay(date: Date): string {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  return `Dans ${diffDays} jours`;
}

/** Ex. "À l'instant", "Il y a 5 min", "Il y a 3h", "Il y a 2j" — pour un instant passé */
export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return `${formatDayMonth(date)}`;
}

/**
 * Compte à rebours court avant le début (comme l'app mobile) : "Dans 25 min",
 * "Dans 3 h", "Demain", "Dans 4 jours", puis "Sam. 8 nov." ; "C'est parti !"
 * une fois commencé.
 */
export function formatStartsIn(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((date.getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return "C'est parti !";
  if (minutes < 60) return `Dans ${minutes} min`;
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
  if (days === 0) return `Dans ${Math.floor(minutes / 60)} h`;
  if (days === 1) return "Demain";
  if (days < 7) return `Dans ${days} jours`;
  return `${formatWeekdayShort(date)} ${formatDayMonth(date)}`;
}

/** Ex. "Aujourd'hui · 18:30", "Demain · 09:00", "Sam. 8 nov. · 10:00" */
export function formatWhen(date: Date, now: Date = new Date()): string {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
  const time = formatTime(date);
  if (days === 0) return `Aujourd'hui · ${time}`;
  if (days === 1) return `Demain · ${time}`;
  return `${formatWeekdayShort(date)} ${formatDayMonth(date)} · ${time}`;
}
