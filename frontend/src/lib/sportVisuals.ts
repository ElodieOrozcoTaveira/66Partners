import type { ElementType } from "react";
import {
  Bike,
  Circle,
  CircleDot,
  Compass,
  Disc,
  Droplets,
  Dumbbell,
  Feather,
  Flag,
  Footprints,
  Goal,
  Grip,
  HandFist,
  Mountain,
  MountainSnow,
  PersonStanding,
  Route,
  Signpost,
  Swords,
  Target,
  Volleyball,
  Waves,
} from "lucide-react";

export interface SportVisual {
  icon: ElementType;
  color: string;
}

const DEFAULT_VISUAL: SportVisual = { icon: Dumbbell, color: "#1F2937" };

// Clés alignées sur `sports.name` en base (voir backend/src/db/seed.ts)
const sportVisuals: Record<string, SportVisual> = {
  Football: { icon: Goal, color: "#E6392E" },
  Basketball: { icon: CircleDot, color: "#F4A61D" },
  Tennis: { icon: Target, color: "#E6392E" },
  Running: { icon: Footprints, color: "#F4A61D" },
  Cyclisme: { icon: Bike, color: "#E6392E" },
  Natation: { icon: Droplets, color: "#F4A61D" },
  Musculation: { icon: Dumbbell, color: "#E6392E" },
  Yoga: { icon: PersonStanding, color: "#F4A61D" },
  Escalade: { icon: Mountain, color: "#E6392E" },
  Badminton: { icon: Feather, color: "#F4A61D" },
  Volleyball: { icon: Volleyball, color: "#E6392E" },
  "Randonnée": { icon: MountainSnow, color: "#F4A61D" },
  Boxe: { icon: HandFist, color: "#E6392E" },
  Padel: { icon: Disc, color: "#F4A61D" },
  Golf: { icon: Flag, color: "#E6392E" },
  "Pétanque": { icon: Circle, color: "#F4B400" },
  Gravel: { icon: Compass, color: "#E6392E" },
  VTT: { icon: Route, color: "#F4B400" },
  Squash: { icon: Swords, color: "#E6392E" },
  Pickleball: { icon: Grip, color: "#F4A61D" },
  Paddle: { icon: Waves, color: "#E6392E" },
  Marche: { icon: Signpost, color: "#F4A61D" },
};

export function getSportVisual(sportName: string): SportVisual {
  return sportVisuals[sportName] ?? DEFAULT_VISUAL;
}

const YELLOW_SHADES = new Set(["#F4A61D", "#F4B400"]);
const NUIT = "#1F2937";
const WHITE = "#FFFFFF";

// Contraste du dessin de l'icône selon la couleur du cercle qui la porte
export function getIconColor(circleColor: string): string {
  return YELLOW_SHADES.has(circleColor) ? NUIT : WHITE;
}
