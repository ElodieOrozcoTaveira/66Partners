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
      // Couleurs catalanes : rouge franc et jaune vif, sans orange (le
      // dégradé reste dans les rouges, le jaune est réservé aux badges).
      primary: "#C4121A",
      primaryDark: "#930D13",
      primarySoft: "#FBE6E7",
      accent: "#FFCC00",
      accentSoft: "#FFF7D1",
      gradientTo: "#DE1F22",
      badgeTo: "#FFE14D",
      shadowRgb: "196, 18, 26",
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
  "30": makeBrand(
    "30",
    {
      // Turquoise du Gardon sous le pont du Gard (logo 30Partners), plutôt
      // que le vert : se distingue du 09 (cf. frontend/public/30partners/theme.json).
      primary: "#087F78",
      primaryDark: "#05524D",
      primarySoft: "#E2F3F1",
      accent: "#FDC41C",
      accentSoft: "#FFF6DA",
      gradientTo: "#2BB5A5",
      badgeTo: "#FFDD5E",
      shadowRgb: "8, 127, 120",
    },
    require("../../assets/images/territories/logo30.webp"),
    require("../../assets/images/territories/emblem30.webp"),
    // Gard
    { latitude: 43.98, longitude: 4.1, latitudeDelta: 1.15, longitudeDelta: 1.8 }
  ),
  "81": makeBrand(
    "81",
    {
      // Brique d'Albi, la « ville rouge » (logo 81Partners), plutôt que le
      // rouge vif : se distingue du 31 (cf. frontend/public/81partners/theme.json).
      primary: "#B8461C",
      primaryDark: "#7E2E10",
      primarySoft: "#FBEBE4",
      accent: "#FDAE03",
      accentSoft: "#FFF3D6",
      gradientTo: "#E8792F",
      badgeTo: "#FFD45E",
      shadowRgb: "184, 70, 28",
    },
    require("../../assets/images/territories/logo81.webp"),
    require("../../assets/images/territories/emblem81.webp"),
    // Tarn
    { latitude: 43.8, longitude: 2.2, latitudeDelta: 1.0, longitudeDelta: 1.6 }
  ),
  "82": makeBrand(
    "82",
    {
      // Violet du raisin (chasselas de Moissac, logo 82Partners) et jaune
      // tournesol : couleur propre au 82, distincte des voisins 31/32
      // (rouges), 81 (brique) et du bleu du 65, cf.
      // frontend/public/82partners/theme.json.
      primary: "#6A2C8E",
      primaryDark: "#4A1D64",
      primarySoft: "#F1E8F7",
      accent: "#F5B800",
      accentSoft: "#FEF5D6",
      gradientTo: "#9B4FC0",
      badgeTo: "#FFD84D",
      shadowRgb: "106, 44, 142",
    },
    require("../../assets/images/territories/logo82.webp"),
    require("../../assets/images/territories/emblem82.webp"),
    // Tarn-et-Garonne
    { latitude: 44.08, longitude: 1.3, latitudeDelta: 0.8, longitudeDelta: 1.5 }
  ),
  "65": makeBrand(
    "65",
    {
      // Bleu azur du ciel pyrénéen (logo 65Partners), plus clair que le 82 ;
      // se distingue des voisins 31/32 (rouges), cf.
      // frontend/public/65partners/theme.json.
      primary: "#0A78C8",
      primaryDark: "#075592",
      primarySoft: "#E3F1FB",
      accent: "#F7C21B",
      accentSoft: "#FEF6D9",
      gradientTo: "#2BB3E6",
      badgeTo: "#FFE066",
      shadowRgb: "10, 120, 200",
    },
    require("../../assets/images/territories/logo65.webp"),
    require("../../assets/images/territories/emblem65.webp"),
    // Hautes-Pyrénées
    { latitude: 43.05, longitude: 0.15, latitudeDelta: 1.0, longitudeDelta: 1.0 }
  ),  "46": makeBrand(
    "46",
    {
      // Ocre doré (pierre et soleil du Quercy, logo 46Partners), accent bleu rivière :
      // teinte propre au 46, distincte de tous les autres territoires.
      primary: "#9C6B0E",
      primaryDark: "#6E4A07",
      primarySoft: "#F7EEDC",
      accent: "#2E9BD6",
      accentSoft: "#E1F1FA",
      gradientTo: "#C98F1F",
      badgeTo: "#7CC4EC",
      shadowRgb: "156, 107, 14",
    },
    require("../../assets/images/territories/logo46.webp"),
    require("../../assets/images/territories/emblem46.webp"),
    // Lot
    { latitude: 44.62, longitude: 1.6, latitudeDelta: 0.9, longitudeDelta: 1.4 }
  ),
  "12": makeBrand(
    "12",
    {
      // Rose bruyère (logo 12Partners), accent vert : teinte propre au 12,
      // distincte de tous les autres territoires.
      primary: "#A3245F",
      primaryDark: "#6E1840",
      primarySoft: "#F8E6EE",
      accent: "#8BC34A",
      accentSoft: "#EEF7E3",
      gradientTo: "#C9447F",
      badgeTo: "#B5DC85",
      shadowRgb: "163, 36, 95",
    },
    require("../../assets/images/territories/logo12.webp"),
    require("../../assets/images/territories/emblem12.webp"),
    // Aveyron
    { latitude: 44.28, longitude: 2.65, latitudeDelta: 1.2, longitudeDelta: 1.6 }
  ),
  "48": makeBrand(
    "48",
    {
      // Bleu ardoise (granite et causses, logo 48Partners), accent jaune genêt :
      // teinte propre au 48, distincte de tous les autres territoires.
      primary: "#3D5A73",
      primaryDark: "#27394A",
      primarySoft: "#E7EDF2",
      accent: "#F2C230",
      accentSoft: "#FDF5D6",
      gradientTo: "#5A7F9C",
      badgeTo: "#F7D96B",
      shadowRgb: "61, 90, 115",
    },
    require("../../assets/images/territories/logo48.webp"),
    require("../../assets/images/territories/emblem48.webp"),
    // Lozère
    { latitude: 44.52, longitude: 3.5, latitudeDelta: 0.9, longitudeDelta: 1.3 }
  ),
};

export function getBrand(code: string | null | undefined): Brand {
  return (code && BRANDS[code]) || BRANDS[DEFAULT_BRAND_CODE];
}
