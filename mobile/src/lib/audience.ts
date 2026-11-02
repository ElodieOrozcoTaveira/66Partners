import type { ActivityAudience, Gender } from "../types/domain";

/**
 * Activités « entre femmes » / « entre hommes ». La règle d'accès est
 * appliquée par le serveur (backend/src/utils/audience.ts) : l'app ne fait
 * qu'afficher et prévenir plus tôt.
 */

export const AUDIENCE_LABELS: Record<ActivityAudience, string> = {
  ALL: "Ouverte à tous",
  WOMEN: "Entre femmes",
  MEN: "Entre hommes",
};

/** Libellé du bouton quand on ne correspond pas au public. */
export const AUDIENCE_RESERVED_LABELS: Record<Exclude<ActivityAudience, "ALL">, string> = {
  WOMEN: "Réservée aux femmes",
  MEN: "Réservée aux hommes",
};

export const AUDIENCES: ActivityAudience[] = ["ALL", "WOMEN", "MEN"];

export const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "Femme",
  MALE: "Homme",
};

export const GENDER_UNSPECIFIED_LABEL = "Je préfère ne pas préciser";

/** Explication affichée partout où le genre est demandé. */
export const GENDER_EXPLANATION =
  "Facultatif. Sert uniquement à rejoindre ou organiser des activités « entre femmes » ou « entre hommes ». Jamais affiché sur ton profil ni visible des autres membres.";

/** Genre requis pour ce public, null si l'activité est ouverte à tous. */
export function requiredGender(audience: ActivityAudience): Gender | null {
  if (audience === "WOMEN") return "FEMALE";
  if (audience === "MEN") return "MALE";
  return null;
}

/**
 * Peut-on participer / organiser ? `undefined` = genre pas encore connu
 * (chargement) : on laisse faire, le serveur tranchera.
 */
export function canJoinAudience(audience: ActivityAudience, gender: Gender | null | undefined): boolean {
  const required = requiredGender(audience);
  if (!required || gender === undefined) return true;
  return gender === required;
}
