import type { SportLevel } from "../types/domain";

/**
 * Formulaire de création d'activité (3 étapes, maquette). Les contrôles
 * reprennent les limites du schéma serveur (backend/src/validations/
 * activity.validations.ts) pour prévenir l'utilisateur plus tôt ; le serveur
 * reste l'autorité et revalide tout.
 */

export const TITLE_MAX = 150;
export const DESCRIPTION_MAX = 2000;
export const CITY_MAX = 100;
/** Bornes du sélecteur, comme sur le web (EtapeDetails.tsx). */
export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 100;

export interface ActivityFormState {
  sportId: string;
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  startDate: Date;
  dateChosen: boolean;
  timeChosen: boolean;
  levelRequired: SportLevel;
  maxParticipants: number;
  carpoolEnabled: boolean;
}

/** Demain, à l'heure pleine suivante : point de départ du sélecteur. */
export function initialActivityForm(now: Date = new Date()): ActivityFormState {
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  return {
    sportId: "",
    title: "",
    description: "",
    city: "",
    latitude: null,
    longitude: null,
    startDate: start,
    dateChosen: false,
    timeChosen: false,
    levelRequired: "INTERMEDIATE",
    maxParticipants: 8,
    carpoolEnabled: false,
  };
}

export type ActivityFormStep = 1 | 2 | 3;

/** Premier problème bloquant de l'étape, ou null si on peut continuer. */
export interface ValidateOptions {
  /** false en modification quand la date n'a pas été changée. */
  requireFutureDate?: boolean;
  /** En modification : participants déjà acceptés (on ne peut pas descendre en dessous). */
  minParticipants?: number;
}

export function validateActivityStep(
  step: ActivityFormStep,
  form: ActivityFormState,
  now: Date = new Date(),
  { requireFutureDate = true, minParticipants = MIN_PARTICIPANTS }: ValidateOptions = {}
): string | null {
  if (step >= 1) {
    if (!form.title.trim()) return "Donne un titre à ton activité.";
    if (form.title.trim().length > TITLE_MAX) return `Le titre ne doit pas dépasser ${TITLE_MAX} caractères.`;
    if (!form.sportId) return "Choisis un sport.";
    if (form.description.trim().length > DESCRIPTION_MAX) {
      return `La description ne doit pas dépasser ${DESCRIPTION_MAX} caractères.`;
    }
  }
  if (step >= 2) {
    if (!form.city.trim()) return "Indique le lieu de rendez-vous.";
    if (form.city.trim().length > CITY_MAX) return `Le lieu ne doit pas dépasser ${CITY_MAX} caractères.`;
    if (!form.dateChosen || !form.timeChosen) return "Choisis la date et l'heure.";
    if (requireFutureDate && form.startDate.getTime() <= now.getTime()) {
      return "La date de l'activité doit être dans le futur.";
    }
    if (
      !Number.isInteger(form.maxParticipants) ||
      form.maxParticipants < MIN_PARTICIPANTS ||
      form.maxParticipants > MAX_PARTICIPANTS
    ) {
      return `Le nombre de participants doit être entre ${MIN_PARTICIPANTS} et ${MAX_PARTICIPANTS}.`;
    }
    if (form.maxParticipants < minParticipants) {
      return `${minParticipants} participants sont déjà acceptés : le nombre de places ne peut pas être inférieur.`;
    }
  }
  return null;
}

export interface CreateActivityPayload {
  sportId: string;
  title: string;
  description?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  levelRequired: SportLevel;
  maxParticipants: number;
  carpoolEnabled: boolean;
  territoryId?: string;
}

/** Corps de POST /activities (mêmes champs que le web). */
export function buildActivityPayload(form: ActivityFormState, territoryId?: string): CreateActivityPayload {
  const description = form.description.trim();
  return {
    sportId: form.sportId,
    title: form.title.trim(),
    ...(description ? { description } : {}),
    city: form.city.trim(),
    ...(form.latitude !== null && form.longitude !== null
      ? { latitude: form.latitude, longitude: form.longitude }
      : {}),
    startDate: form.startDate.toISOString(),
    levelRequired: form.levelRequired,
    maxParticipants: form.maxParticipants,
    carpoolEnabled: form.carpoolEnabled,
    ...(territoryId ? { territoryId } : {}),
  };
}

/** Pré-remplit le formulaire avec une activité existante (modification). */
export function formFromActivity(activity: {
  sportId: string;
  title: string;
  description: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  levelRequired: SportLevel;
  maxParticipants: number;
  carpoolEnabled: boolean;
}): ActivityFormState {
  return {
    sportId: activity.sportId,
    title: activity.title,
    description: activity.description ?? "",
    city: activity.city,
    latitude: activity.latitude,
    longitude: activity.longitude,
    startDate: new Date(activity.startDate),
    dateChosen: true,
    timeChosen: true,
    levelRequired: activity.levelRequired,
    maxParticipants: activity.maxParticipants,
    carpoolEnabled: activity.carpoolEnabled,
  };
}

export type ActivityChanges = Partial<{
  sportId: string;
  title: string;
  description: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  levelRequired: SportLevel;
  maxParticipants: number;
  carpoolEnabled: boolean;
}>;

/**
 * Corps de PATCH /activities/:id : uniquement les champs modifiés. La date
 * n'est envoyée que si elle change (le serveur exige une date future, ce qui
 * bloquerait sinon toute modification d'une activité imminente).
 */
export function buildActivityChanges(original: ActivityFormState, form: ActivityFormState): ActivityChanges {
  const changes: ActivityChanges = {};
  const title = form.title.trim();
  const description = form.description.trim();
  const city = form.city.trim();

  if (form.sportId !== original.sportId) changes.sportId = form.sportId;
  if (title !== original.title.trim()) changes.title = title;
  if (description !== original.description.trim()) changes.description = description || null;
  if (city !== original.city.trim() || form.latitude !== original.latitude || form.longitude !== original.longitude) {
    changes.city = city;
    changes.latitude = form.latitude;
    changes.longitude = form.longitude;
  }
  if (form.startDate.getTime() !== original.startDate.getTime()) changes.startDate = form.startDate.toISOString();
  if (form.levelRequired !== original.levelRequired) changes.levelRequired = form.levelRequired;
  if (form.maxParticipants !== original.maxParticipants) changes.maxParticipants = form.maxParticipants;
  if (form.carpoolEnabled !== original.carpoolEnabled) changes.carpoolEnabled = form.carpoolEnabled;
  return changes;
}
