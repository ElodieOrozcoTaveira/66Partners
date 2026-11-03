import type {
  Activity,
  ActivityPhoto,
  ActivityStatus,
  Participation,
  ParticipationWithUser,
} from "../types/domain";
import type { ActivityChanges, CreateActivityPayload } from "../lib/activityForm";
import type { AvatarFile } from "../lib/avatarFile";
import { api } from "./api";

export interface ActivityFilters {
  /** Code du territoire (obligatoire côté backend). */
  territory: string;
  sportId?: string;
  status?: ActivityStatus;
  /** Ne garder que les activités où cet utilisateur est participant accepté. */
  participantId?: string;
  /** ISO — borne basse sur la date de début. */
  from?: string;
  /** ISO — borne haute sur la date de début. */
  to?: string;
}

/** GET /activities — liste publique d'un territoire, triée par date. */
export async function getActivities(filters: ActivityFilters): Promise<Activity[]> {
  const response = await api.get<{ success: boolean; activities: Activity[] }>(
    "/activities",
    { params: filters }
  );

  return response.data.activities;
}

export async function getActivity(id: string): Promise<Activity> {
  const response = await api.get<{ success: boolean; activity: Activity }>(
    `/activities/${id}`
  );

  return response.data.activity;
}

/** Statut de ma demande pour cette activité, ou null si aucune. */
export async function getMyParticipation(activityId: string): Promise<Participation | null> {
  const response = await api.get<{ success: boolean; participation: Participation | null }>(
    `/activities/${activityId}/my-participation`
  );

  return response.data.participation;
}

/**
 * Créateur : toutes les demandes. Participant accepté : les acceptés seulement.
 * Toute autre personne reçoit 403 (contrôle serveur).
 */
export async function getParticipations(activityId: string): Promise<ParticipationWithUser[]> {
  const response = await api.get<{ success: boolean; participations: ParticipationWithUser[] }>(
    `/activities/${activityId}/participations`
  );

  return response.data.participations;
}

/** Demande de participation : créée en PENDING, à valider par le créateur. */
export async function joinActivity(activityId: string): Promise<Participation> {
  const response = await api.post<{ success: boolean; participation: Participation }>(
    `/activities/${activityId}/join`
  );

  return response.data.participation;
}

/** Annule ma demande (ou ma participation). */
export async function cancelParticipation(participationId: string): Promise<void> {
  await api.delete(`/participations/${participationId}`);
}

export async function acceptParticipation(participationId: string): Promise<void> {
  await api.put(`/participations/${participationId}/accept`);
}

export async function refuseParticipation(participationId: string): Promise<void> {
  await api.put(`/participations/${participationId}/refuse`);
}

/**
 * POST /activities — crée l'activité (l'utilisateur en devient l'organisateur).
 * La réponse ne contient que les colonnes de l'activité (pas sportName ni
 * compteurs) : recharger via getActivity pour l'affichage complet.
 */
export async function createActivity(payload: CreateActivityPayload): Promise<{ id: string }> {
  const response = await api.post<{ success: boolean; activity: { id: string } }>(
    "/activities",
    payload
  );
  return response.data.activity;
}

/** PATCH /activities/:id — réservé à l'organisateur (vérifié côté serveur). */
export async function updateActivity(
  id: string,
  changes: ActivityChanges | { status: ActivityStatus }
): Promise<void> {
  await api.patch(`/activities/${id}`, changes);
}

/** DELETE /activities/:id — suppression définitive (organisateur uniquement). */
export async function deleteActivity(id: string): Promise<void> {
  await api.delete(`/activities/${id}`);
}

/**
 * Covoiturage (participant accepté, activité qui le propose) : ouvre un fil
 * privé avec l'organisateur, comme sur le web.
 */
export async function requestCarpool(activityId: string): Promise<void> {
  await api.post(`/activities/${activityId}/carpool`);
}

export async function cancelCarpool(activityId: string): Promise<void> {
  await api.delete(`/activities/${activityId}/carpool`);
}

/** Photos : organisateur et participants acceptés uniquement (403 sinon). */
export async function getActivityPhotos(activityId: string): Promise<ActivityPhoto[]> {
  const response = await api.get<{ success: boolean; photos: ActivityPhoto[] }>(
    `/activities/${activityId}/photos`
  );
  return response.data.photos;
}

/** Ajout d'une photo, seulement une fois l'activité passée (règle serveur). */
export async function uploadActivityPhoto(activityId: string, file: AvatarFile): Promise<void> {
  const body = new FormData();
  // Format attendu par React Native pour un fichier local dans un FormData.
  body.append("file", file as unknown as Blob);
  await api.post(`/activities/${activityId}/photos`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** Chacun ne peut supprimer que ses propres photos (vérifié côté serveur). */
export async function deleteActivityPhoto(photoId: string): Promise<void> {
  await api.delete(`/activity-photos/${photoId}`);
}
