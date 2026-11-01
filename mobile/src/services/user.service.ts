import type { User } from "../types/auth";
import type { Availability, PublicUser, UserSport, Weekday } from "../types/domain";
import type { AvatarFile } from "../lib/avatarFile";
import { api } from "./api";

export async function getMySports(): Promise<UserSport[]> {
  const response = await api.get<{ success: boolean; sports: UserSport[] }>("/users/me/sports");

  return response.data.sports;
}

export async function getMyAvailabilities(): Promise<Availability[]> {
  const response = await api.get<{ success: boolean; availabilities: Availability[] }>(
    "/users/me/availabilities"
  );

  return response.data.availabilities;
}

export interface UpdateProfileInput {
  pseudo?: string;
  city?: string | null;
  headline?: string | null;
  lookingFor?: string | null;
  openTo?: string | null;
}

export async function updateMe(input: UpdateProfileInput): Promise<User> {
  const response = await api.patch<{ success: boolean; user: User }>("/users/me", input);

  return response.data.user;
}

export async function getPublicUser(userId: string): Promise<PublicUser> {
  const response = await api.get<{ success: boolean; user: PublicUser }>(`/users/${userId}`);

  return response.data.user;
}

export async function getUserSports(userId: string): Promise<UserSport[]> {
  const response = await api.get<{ success: boolean; sports: UserSport[] }>(
    `/users/${userId}/sports`
  );

  return response.data.sports;
}

/**
 * Suppression définitive du compte (DELETE /users/me). Côté serveur
 * (AccountDeletionService) : participations, messages, notifications,
 * sports, disponibilités, photos et abonnements push sont supprimés ;
 * les activités créées restent visibles mais sans créateur.
 */
export async function deleteMyAccount(): Promise<void> {
  await api.delete("/users/me");
}

/** POST /users/me/avatar (multipart, champ "file") — renvoie l'utilisateur à jour. */
export async function uploadAvatar(file: AvatarFile): Promise<User> {
  const body = new FormData();
  // Format attendu par React Native pour un fichier local dans un FormData.
  body.append("file", file as unknown as Blob);
  const response = await api.post<{ success: boolean; user: User }>("/users/me/avatar", body, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return response.data.user;
}

/** POST /users/me/availabilities — heures "HH:mm" (fin après début, vérifié serveur). */
export async function createAvailability(input: {
  weekday: Weekday;
  startTime: string;
  endTime: string;
}): Promise<Availability> {
  const response = await api.post<{ success: boolean; availability: Availability }>(
    "/users/me/availabilities",
    input
  );
  return response.data.availability;
}

/** DELETE /users/me/availabilities/:id */
export async function deleteAvailability(id: string): Promise<void> {
  await api.delete(`/users/me/availabilities/${id}`);
}

export async function getUserAvailabilities(userId: string): Promise<Availability[]> {
  const response = await api.get<{ success: boolean; availabilities: Availability[] }>(
    `/users/${userId}/availabilities`
  );

  return response.data.availabilities;
}
