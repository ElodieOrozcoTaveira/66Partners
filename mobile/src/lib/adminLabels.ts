// Libellés et couleurs de l'espace admin : mêmes valeurs que le web
// (frontend/src/lib/adminLabels.ts).

import { LEVEL_LABELS } from "./labels";
import type { SportLevel } from "../types/domain";

export const ACTIVITY_STATUS_ORDER = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export const ADMIN_ACTIVITY_STATUS_LABELS: Record<string, string> = {
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

export const ADMIN_PARTICIPATION_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Acceptée",
  PENDING: "En attente",
  REFUSED: "Refusée",
};

export const PARTICIPATION_STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "#16a34a",
  PENDING: "#eda100",
  REFUSED: "#c62828",
};

export const LEVEL_ORDER: SportLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
export const LEVEL_COLORS = ["#86efac", "#22c55e", "#f59e0b", "#c62828"];

export function levelLabel(level: string): string {
  return LEVEL_LABELS[level as SportLevel] ?? level;
}

export const PROVIDER_LABELS: Record<string, string> = {
  email: "Email",
  google: "Google",
  facebook: "Facebook",
};

export const FALLBACK_COLOR = "#94a3b8";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const numberFormatter = new Intl.NumberFormat("fr-FR");

export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFormatter.format(new Date(iso));
export const formatNumber = (value: number) => numberFormatter.format(value);

export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Ignore accents et casse pour la recherche. */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
