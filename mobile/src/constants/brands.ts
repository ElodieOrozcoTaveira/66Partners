/**
 * Thèmes de marque par territoire (déclinaisons "Partners").
 *
 * Couleurs reprises du web : frontend/public/<code>partners/theme.json
 * (primary, primaryDark, accent, accentDark) et, pour le 66, des valeurs par
 * défaut de frontend/src/styles/variables/variables.scss. Comme sur le web,
 * la couleur principale remplace le rouge et l'accent remplace le jaune.
 * Les teintes "soft" et le dégradé sont propres au mobile (maquette).
 *
 * Ajouter un territoire : `python3 scripts/import-territory-assets.py <code>`
 * (copie logo + emblème du site dans assets/images/territories), puis ajouter
 * son entrée ici. Un code inconnu retombe sur le thème 66.
 */

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface Brand {
  code: string;
  primary: string;
  primaryDark: string;
  /** Fond très clair de la couleur principale (pastilles, onglet actif). */
  primarySoft: string;
  accent: string;
  accentSoft: string;
  /** Dégradé des boutons d'action et du bouton "+". */
  gradient: string;
  gradientDiagonal: string;
  /** Badge "Aujourd'hui" / "Demain". */
  badgeGradient: string;
  /** Ombre colorée des boutons d'action. */
  raisedShadow: string;
  logo: number;
  /** Visuel « emblème » du territoire (repris du web), ex. couverture de profil. */
  emblem: number;
  /** Cadrage de la carte : le département du territoire en entier. */
  mapRegion: MapRegion;
}

function linear(angle: number, from: string, to: string): string {
  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}

function makeBrand(
  code: string,
  colors: {
    primary: string;
    primaryDark: string;
    primarySoft: string;
    accent: string;
    accentSoft: string;
    gradientTo: string;
    badgeTo: string;
    shadowRgb: string;
  },
  logo: number,
  emblem: number,
  mapRegion: MapRegion
): Brand {
  return {
    code,
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primarySoft: colors.primarySoft,
    accent: colors.accent,
    accentSoft: colors.accentSoft,
    gradient: linear(90, colors.primary, colors.gradientTo),
    gradientDiagonal: linear(135, colors.primary, colors.gradientTo),
    badgeGradient: linear(90, colors.accent, colors.badgeTo),
    raisedShadow: `0px 6px 16px rgba(${colors.shadowRgb}, 0.35)`,
    logo,
    emblem,
    mapRegion,
  };
}

export const DEFAULT_BRAND_CODE = "66";

const BRANDS: Record<string, Brand> = {
  "66": makeBrand(
    "66",
    {
      primary: "#E6392E",
      primaryDark: "#C62828",
      primarySoft: "#FDECEA",
      accent: "#F4A61D",
      accentSoft: "#FEF3DE",
      gradientTo: "#F47B20",
      badgeTo: "#F7C948",
      shadowRgb: "230, 57, 46",
    },
    require("../../assets/images/logo.webp"),
    require("../../assets/images/territories/emblem66.webp"),
    // Pyrénées-Orientales
    { latitude: 42.6, longitude: 2.5, latitudeDelta: 0.75, longitudeDelta: 1.45 }
  ),
  "34": makeBrand(
    "34",
    {
      primary: "#0A2542",
      primaryDark: "#061A2F",
      primarySoft: "#E6EDF6",
      accent: "#E7B254",
      accentSoft: "#FBF2E1",
      gradientTo: "#1E63C9",
      badgeTo: "#F3CF83",
      shadowRgb: "10, 37, 66",
    },
    require("../../assets/images/territories/logo34.webp"),
    require("../../assets/images/territories/emblem34.webp"),
    // Hérault
    { latitude: 43.58, longitude: 3.4, latitudeDelta: 0.85, longitudeDelta: 1.5 }
  ),
  "11": makeBrand(
    "11",
    {
      primary: "#0B2A4A",
      primaryDark: "#061C32",
      primarySoft: "#E7EEF6",
      accent: "#F2A83B",
      accentSoft: "#FDF1DF",
      gradientTo: "#D94A2B",
      badgeTo: "#F6C774",
      shadowRgb: "11, 42, 74",
    },
    require("../../assets/images/territories/logo11.webp"),
    require("../../assets/images/territories/emblem11.webp"),
    // Aude
    { latitude: 43.05, longitude: 2.4, latitudeDelta: 0.95, longitudeDelta: 1.6 }
  ),
  "31": makeBrand(
    "31",
    {
      // Couleurs du logo 31Partners (cf. frontend/public/31partners/theme.json).
      primary: "#D90A14",
      primaryDark: "#8E0710",
      primarySoft: "#FDE8E9",
      accent: "#FDB402",
      accentSoft: "#FFF4D9",
      gradientTo: "#F26A0C",
      badgeTo: "#FFD75E",
      shadowRgb: "217, 10, 20",
    },
    require("../../assets/images/territories/logo31.webp"),
    require("../../assets/images/territories/emblem31.webp"),
    // Haute-Garonne
    { latitude: 43.3, longitude: 1.25, latitudeDelta: 1.45, longitudeDelta: 1.75 }
  ),
  "32": makeBrand(
    "32",
    {
      // Couleurs du logo 32Partners (cf. frontend/public/32partners/theme.json).
      primary: "#A8150F",
      primaryDark: "#6E0E08",
      primarySoft: "#F9E7E6",
      accent: "#FEBF03",
      accentSoft: "#FFF5DA",
      gradientTo: "#D4651A",
      badgeTo: "#FFD95E",
      shadowRgb: "168, 21, 15",
    },
    require("../../assets/images/territories/logo32.webp"),
    require("../../assets/images/territories/emblem32.webp"),
    // Gers
    { latitude: 43.68, longitude: 0.45, latitudeDelta: 0.95, longitudeDelta: 1.65 }
  ),
  "09": makeBrand(
    "09",
    {
      // Couleurs du logo 09Partners (cf. frontend/public/09partners/theme.json).
      primary: "#1F7A12",
      primaryDark: "#0B3A1E",
      primarySoft: "#E7F2E4",
      accent: "#F6B80E",
      accentSoft: "#FFF6D9",
      gradientTo: "#6DAA2C",
      badgeTo: "#FFDD5E",
      shadowRgb: "31, 122, 18",
    },
    require("../../assets/images/territories/logo09.webp"),
    require("../../assets/images/territories/emblem09.webp"),
    // Ariège
    { latitude: 42.93, longitude: 1.5, latitudeDelta: 0.9, longitudeDelta: 1.5 }
  ),
};

export function getBrand(code: string | null | undefined): Brand {
  return (code && BRANDS[code]) || BRANDS[DEFAULT_BRAND_CODE];
}
