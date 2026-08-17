const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWeekday(date: Date): string {
  return weekdayFormatter.format(date).replace(".", "").toUpperCase();
}

export function formatMonth(date: Date): string {
  return monthFormatter.format(date).replace(".", "").toUpperCase();
}

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}
