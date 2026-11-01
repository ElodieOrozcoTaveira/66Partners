/**
 * Validations de confort côté mobile : elles évitent un aller-retour réseau
 * pour une erreur évidente, mais le backend (schémas Zod) reste l'autorité.
 * Les limites reprennent backend/src/validations/*.validations.ts.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PSEUDO_MAX_LENGTH = 100;
export const CITY_MAX_LENGTH = 100;
export const PROFILE_LINE_MAX_LENGTH = 200;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export interface RegisterFields {
  pseudo: string;
  email: string;
  password: string;
  city: string;
  territoryCode: string;
  termsAccepted: boolean;
}

/** Premier problème bloquant du formulaire d'inscription, ou null. */
export function validateRegister(fields: RegisterFields): string | null {
  if (!fields.pseudo.trim()) return "Renseigne ton pseudo.";
  if (fields.pseudo.trim().length > PSEUDO_MAX_LENGTH) {
    return `Ton pseudo ne doit pas dépasser ${PSEUDO_MAX_LENGTH} caractères.`;
  }
  if (!isValidEmail(fields.email)) return "Renseigne une adresse email valide.";
  if (fields.password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  }
  if (fields.password.length > PASSWORD_MAX_LENGTH) {
    return `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
  }
  if (fields.city.trim().length > CITY_MAX_LENGTH) {
    return `La ville ne doit pas dépasser ${CITY_MAX_LENGTH} caractères.`;
  }
  if (!fields.territoryCode) return "Sélectionne ton territoire.";
  if (!fields.termsAccepted) {
    return "Tu dois accepter les Mentions légales et la Politique de confidentialité.";
  }
  return null;
}

export function validateLogin(email: string, password: string): string | null {
  if (!email.trim() || !password) return "Renseigne ton email et ton mot de passe.";
  if (!isValidEmail(email)) return "Renseigne une adresse email valide.";
  return null;
}
