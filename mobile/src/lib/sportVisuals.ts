import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface SportVisual {
  icon: IconName;
  color: string;
}

const DEFAULT_VISUAL: SportVisual = { icon: "dumbbell", color: "#1F2937" };

const ROUGE = "#EF5350";
const JAUNE = "#F4A61D";
const VERT = "#66BB6A";
const BLEU = "#42A5F5";
const VIOLET = "#AB47BC";
const ORANGE = "#FFA726";
const ROSE = "#EC407A";
const TURQUOISE = "#26C6DA";

// Clés alignées sur `sports.name` en base, couleurs reprises du web
// (frontend/src/lib/sportVisuals.ts). Un sport ajouté en base sans entrée ici
// s'affiche simplement avec le visuel par défaut : aucune refonte nécessaire.
const SPORT_VISUALS: Record<string, SportVisual> = {
  Badminton: { icon: "badminton", color: ROUGE },
  Basketball: { icon: "basketball", color: JAUNE },
  Boxe: { icon: "boxing-glove", color: VERT },
  Cyclisme: { icon: "bike", color: BLEU },
  Escalade: { icon: "carabiner", color: VIOLET },
  Football: { icon: "soccer", color: ORANGE },
  Golf: { icon: "golf", color: ROSE },
  Gravel: { icon: "bike-fast", color: TURQUOISE },
  Marche: { icon: "walk", color: ROUGE },
  Musculation: { icon: "dumbbell", color: JAUNE },
  Natation: { icon: "swim", color: VERT },
  Paddle: { icon: "rowing", color: BLEU },
  Padel: { icon: "tennis", color: VIOLET },
  Pickleball: { icon: "table-tennis", color: ORANGE },
  Pétanque: { icon: "circle-double", color: ROSE },
  Randonnée: { icon: "hiking", color: TURQUOISE },
  Running: { icon: "run", color: ROUGE },
  Squash: { icon: "racquetball", color: JAUNE },
  Tennis: { icon: "tennis-ball", color: VERT },
  VTT: { icon: "bike", color: BLEU },
  Volleyball: { icon: "volleyball", color: VIOLET },
  Yoga: { icon: "yoga", color: ORANGE },
  Roller: { icon: "roller-skate", color: ROSE },
  Trail: { icon: "run-fast", color: TURQUOISE },
};

export function getSportVisual(sportName: string): SportVisual {
  return SPORT_VISUALS[sportName] ?? DEFAULT_VISUAL;
}
