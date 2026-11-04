import { isAxiosError } from "axios";
import api from "../lib/axios";

/** Émis quand une rencontre vient d'être validée (detail : { activityId, stravaUrl }). */
export const STRAVA_VALIDATED_EVENT = "strava:meeting-validated";

export interface StravaStatus {
  linked: boolean;
  linkedAt: string | null;
  /** Nom du compte Strava relié (pour vérifier que c'est bien le sien). */
  athleteName: string | null;
  athleteAvatarUrl: string | null;
}

export interface MeetingValidation {
  validated: boolean;
  stravaUrl: string | null;
}

export async function fetchStravaStatus(): Promise<StravaStatus> {
  const { data } = await api.get<StravaStatus>("/api/strava/status");
  return { linked: data.linked, linkedAt: data.linkedAt, athleteName: data.athleteName ?? null, athleteAvatarUrl: data.athleteAvatarUrl ?? null };
}

/** Redirige le navigateur vers la page d'autorisation Strava. */
export async function fetchMemberStravaLinked(userId: string): Promise<boolean> {
  const { data } = await api.get<{ linked: boolean }>(`/api/strava/users/${userId}/status`);
  return data.linked;
}

/** Redirige le navigateur vers la page d'autorisation Strava. */
export async function startStravaConnect(): Promise<void> {
  // Sur téléphone, Strava ouvre son app : c'est le compte de la personne qui tient le téléphone.
  const mobile = /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const { data } = await api.get<{ url: string }>("/api/strava/connect", {
    params: mobile ? { mobile: 1 } : undefined,
  });
  window.location.assign(data.url);
}

export async function disconnectStrava(): Promise<void> {
  await api.delete("/api/strava");
}

export async function fetchMeetingValidation(activityId: string): Promise<MeetingValidation> {
  const { data } = await api.get<MeetingValidation>(`/api/strava/activities/${activityId}/validation`);
  return { validated: data.validated, stravaUrl: data.stravaUrl };
}

export async function validateMeeting(activityId: string): Promise<{ stravaUrl: string; name: string }> {
  const { data } = await api.post<{ stravaUrl: string; name: string }>(
    `/api/strava/activities/${activityId}/validate`,
  );
  return { stravaUrl: data.stravaUrl, name: data.name };
}

export function stravaErrorCode(error: unknown): string | null {
  return isAxiosError<{ code?: string }>(error) ? (error.response?.data?.code ?? null) : null;
}

export function stravaErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}

/** Messages affichés au retour de Strava (paramètre `reason` du callback). */
export const STRAVA_CALLBACK_ERRORS: Record<string, string> = {
  STRAVA_ACCESS_DENIED: "Connexion à Strava annulée.",
  STRAVA_INVALID_STATE: "Le lien de connexion a expiré. Réessaie.",
  STRAVA_SCOPE_MISSING:
    "Coche bien l'accès en lecture et en écriture à tes activités pour que 66Partners puisse les mettre à jour.",
  STRAVA_ALREADY_LINKED: "Ce compte Strava est déjà relié à un autre compte.",
  STRAVA_NOT_CONFIGURED: "La connexion à Strava n'est pas encore disponible.",
};
