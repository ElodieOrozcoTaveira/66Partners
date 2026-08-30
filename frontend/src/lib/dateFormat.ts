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
