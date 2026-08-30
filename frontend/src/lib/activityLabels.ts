export type ActivityLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export const LEVEL_LABELS: Record<ActivityLevel, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

export const LEVEL_OPTIONS: ActivityLevel[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];
