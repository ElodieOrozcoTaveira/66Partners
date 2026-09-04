import type { ElementType } from "react";
import {
  Bike,
  Circle,
  CircleDot,
  Disc,
  WavesHorizontal,
  Dumbbell,
  Feather,
  LandPlot,
  Footprints,
  Goal,
  Grip,
  HandFist,
  Mountain,
  SportShoe,
  PersonStanding,
  Signpost,
  Target,
  Volleyball,
  Waves,
  Road,
} from "lucide-react";

export interface SportVisual {
  icon: ElementType;
  color: string;
}

const DEFAULT_VISUAL: SportVisual = { icon: Dumbbell, color: "#1F2937" };


const ROUGE = "#EF5350";
const JAUNE = "#FDD835";
const VERT = "#66BB6A";
const BLEU = "#42A5F5";
const VIOLET = "#AB47BC";
const ORANGE = "#FFA726";
const ROSE = "#EC407A";
const TURQUOISE = "#26C6DA";

// Clés alignées sur `sports.name` en base (voir backend/src/db/seed.ts)
// Couleurs volontairement toutes différentes d'un sport au suivant
// (dans l'ordre alphabétique affiché sur la page Sports).
const sportVisuals: Record<string, SportVisual> = {
  Badminton: { icon: Feather, color: ROUGE },
  Basketball: { icon: CircleDot, color: JAUNE },
  Boxe: { icon: HandFist, color: VERT },
  Cyclisme: { icon: Bike, color: BLEU },
  Escalade: { icon: Mountain, color: VIOLET },
  Football: { icon: Goal, color: ORANGE },
  Golf: { icon: LandPlot, color: ROSE },
  Gravel: { icon: Bike, color: TURQUOISE },
  Marche: { icon: Signpost, color: ROUGE },
  Musculation: { icon: Dumbbell, color: JAUNE },
  Natation: { icon: WavesHorizontal, color: VERT },
  Paddle: { icon: Waves, color: BLEU },
  Padel: { icon: Disc, color: VIOLET },
  Pickleball: { icon: Grip, color: ORANGE },
  "Pétanque": { icon: Circle, color: ROSE },
  "Randonnée": { icon: Footprints, color: TURQUOISE },
  Running: { icon: SportShoe, color: ROUGE },
  Squash: { icon: Disc, color: JAUNE },
  Tennis: { icon: Target, color: VERT },
  VTT: { icon: Bike, color: BLEU },
  Volleyball: { icon: Volleyball, color: VIOLET },
  Yoga: { icon: PersonStanding, color: ORANGE },
  Roller: {icon: Road, color:ROSE},
};

export function getSportVisual(sportName: string): SportVisual {
  return sportVisuals[sportName] ?? DEFAULT_VISUAL;
}

const NUIT = "#1F2937";
const WHITE = "#FFFFFF";

// Luminance relative (WCAG) pour choisir un icône foncé ou blanc
// selon que le fond du badge soit clair ou sombre.
function getRelativeLuminance(hexColor: string): number {
  const channels = hexColor.replace("#", "").match(/.{2}/g) ?? [];
  const [r, g, b] = channels.map((hex) => {
    const value = parseInt(hex, 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

// Contraste du dessin de l'icône selon la couleur du cercle qui la porte
export function getIconColor(circleColor: string): string {
  return getRelativeLuminance(circleColor) > 0.5 ? NUIT : WHITE;
}

// Ombre douce teintée de la couleur du sport (ex: pour box-shadow de carte)
export function getSportShadow(circleColor: string, alpha = 0.28): string {
  const channels = circleColor.replace("#", "").match(/.{2}/g) ?? [];
  const [r, g, b] = channels.map((hex) => parseInt(hex, 16));
  return `rgba(${r ?? 0}, ${g ?? 0}, ${b ?? 0}, ${alpha})`;
}
