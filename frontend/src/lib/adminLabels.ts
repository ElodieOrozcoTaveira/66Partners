// Libellés et couleurs partagés par les pages admin (mêmes libellés que le
// site public : "Ouverte", "Confirmée", etc.).

import { LEVEL_LABELS, type ActivityLevel } from "./activityLabels";

export const ACTIVITY_STATUS_ORDER = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ouverte",
  CONFIRMED: "Confirmée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const ACTIVITY_STATUS_COLORS: Record<string, string> = {
  PENDING: "#2563eb",
  CONFIRMED: "#16a34a",
  COMPLETED: "#64748b",
  CANCELLED: "#c62828",
};

export const PARTICIPATION_STATUS_ORDER = ["ACCEPTED", "PENDING", "REFUSED"] as const;

export const PARTICIPATION_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Acceptée",
  PENDING: "En attente",
  REFUSED: "Refusée",
};

export const PARTICIPATION_STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "#16a34a",
  PENDING: "#eda100",
  REFUSED: "#c62828",
};

export const LEVEL_ORDER: ActivityLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

export function levelLabel(level: string): string {
  return LEVEL_LABELS[level as ActivityLevel] ?? level;
}

export const PROVIDER_LABELS: Record<string, string> = {
  email: "Email",
  google: "Google",
  facebook: "Facebook",
};

export const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

export const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const numberFormatter = new Intl.NumberFormat("fr-FR");

export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Ignore accents et casse pour la recherche. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export const REPORT_REASON_LABELS: Record<string, string> = {
  HARASSMENT: "Harcèlement ou insultes",
  INAPPROPRIATE: "Contenu inapproprié",
  SPAM: "Faux profil ou spam",
  DANGEROUS: "Comportement dangereux",
  OTHER: "Autre",
};

export const REPORT_CONTEXT_LABELS: Record<string, string> = {
  PROFILE: "Profil",
  MESSAGE: "Message",
  ACTIVITY: "Activité",
  PHOTO: "Photo",
};
