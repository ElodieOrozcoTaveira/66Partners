import type {
  ActivityStatus,
  ParticipationStatus,
  SportLevel,
  Weekday,
} from "../types/domain";

// Mêmes libellés que le web (frontend/src/lib/activityLabels.ts, weekdayLabels.ts).

export const LEVEL_LABELS: Record<SportLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: "Ouverte",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Terminée",
};

export const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  PENDING: "Demande en attente",
  ACCEPTED: "Participation confirmée",
  REFUSED: "Demande refusée",
};

export const WEEKDAYS: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

/** "18:00" -> "18h", "18:30" -> "18h30" */
export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(":");
  return minutes === "00" ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}
