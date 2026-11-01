/**
 * Système de design 66Partners (mobile).
 *
 * Couleurs reprises de la charte (Conception/Maquettes/maquetteappli.png) et
 * des variables SCSS du web (frontend/src/styles/variables/variables.scss) :
 * rouge #E6392E, jaune #F4A61D, nuit #1F2937, gris #F5F5F5, beige #FFF7EB.
 * Tout écran doit passer par ces tokens plutôt que des valeurs en dur.
 */

export const Colors = {
  // Couleurs de marque (principale, accent, dégradés) : thème du territoire,
  // cf. src/constants/brands.ts et useBrand().

  text: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textOnPrimary: "#FFFFFF",

  background: "#FFFFFF",
  backgroundAlt: "#FFF7EB",
  surface: "#F5F5F5",
  border: "#E5E7EB",

  success: "#2E7D32",
  successSoft: "#E8F5E9",
  warning: "#B45309",
  warningSoft: "#FEF3C7",
  danger: "#C62828",
  dangerSoft: "#FDECEA",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Typography = {
  title: { fontSize: 28, fontWeight: "800", color: Colors.text },
  heading: { fontSize: 20, fontWeight: "700", color: Colors.text },
  subheading: { fontSize: 16, fontWeight: "700", color: Colors.text },
  body: { fontSize: 15, lineHeight: 22, color: Colors.text },
  caption: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  label: { fontSize: 14, fontWeight: "600", color: Colors.text },
} as const;

/** Voile sombre en bas d'une photo (lisibilité). Dégradés de marque : brands.ts. */
export const Gradients = {
  photoShade: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
} as const;

/** Ombre douce des cartes (iOS + Android via boxShadow). Ombre colorée : brands.ts. */
export const Shadow = {
  card: { boxShadow: "0px 4px 14px rgba(31, 41, 55, 0.08)" },
} as const;

/** Hauteur minimale d'une cible tactile (recommandations Apple/Google). */
export const TOUCH_TARGET = 48;
