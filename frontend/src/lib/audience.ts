/**
 * Activités « entre femmes » / « entre hommes ». La règle d'accès est
 * appliquée par le serveur (backend/src/utils/audience.ts) : le site ne fait
 * qu'afficher et prévenir plus tôt. Mêmes libellés que le mobile.
 */

export type ActivityAudience = "ALL" | "WOMEN" | "MEN";
/** Genre déclaré (facultatif, jamais public) ; null = « je préfère ne pas préciser ». */
export type Gender = "FEMALE" | "MALE";

export const AUDIENCE_OPTIONS: ActivityAudience[] = ["ALL", "WOMEN", "MEN"];

export const AUDIENCE_LABELS: Record<ActivityAudience, string> = {
  ALL: "Ouverte à tous",
  WOMEN: "Entre femmes",
  MEN: "Entre hommes",
};

export const AUDIENCE_RESERVED_LABELS: Record<Exclude<ActivityAudience, "ALL">, string> = {
  WOMEN: "Réservée aux femmes",
  MEN: "Réservée aux hommes",
};

export const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "Femme",
  MALE: "Homme",
};

export const GENDER_UNSPECIFIED_LABEL = "Je préfère ne pas préciser";

export const GENDER_EXPLANATION =
  "Facultatif. Sert uniquement à rejoindre ou organiser des activités « entre femmes » ou « entre hommes ». Jamais affiché sur ton profil ni visible des autres membres.";

export function requiredGender(audience: ActivityAudience): Gender | null {
  if (audience === "WOMEN") return "FEMALE";
  if (audience === "MEN") return "MALE";
  return null;
}

/**
 * Affiche-t-on « Rejoindre » ? Seul un genre DÉCLARÉ et différent bloque.
 * Genre non renseigné (null) ou pas encore chargé (undefined) : le bouton
 * reste, et le serveur répond GENDER_REQUIRED → on demande le genre.
 */
export function canJoinAudience(audience: ActivityAudience, gender: Gender | null | undefined): boolean {
  const required = requiredGender(audience);
  if (!required || !gender) return true;
  return gender === required;
}
