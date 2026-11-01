import type { Sport } from "../types/domain";
import { api } from "./api";

export type { Sport };

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

export async function getSports(): Promise<Sport[]> {
  const response = await api.get<SportsResponse>("/sports");

  return response.data.sports;
}

/** GET /sports/favorites/mine — identifiants des sports favoris (comme le web). */
export async function getMyFavoriteSportIds(): Promise<string[]> {
  const response = await api.get<{ success: boolean; sportIds: string[] }>("/sports/favorites/mine");
  return response.data.sportIds;
}

/** Sports favoris de l'utilisateur, triés par nom. */
export async function getMyFavoriteSports(): Promise<Sport[]> {
  const [sports, favoriteIds] = await Promise.all([getSports(), getMyFavoriteSportIds()]);
  const ids = new Set(favoriteIds);
  return sports.filter((sport) => ids.has(sport.id)).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** GET /sports/favorites/:userId — sports favoris d'un autre membre (comme le web), triés par nom. */
export async function getUserFavoriteSports(userId: string): Promise<Sport[]> {
  const [sports, response] = await Promise.all([
    getSports(),
    api.get<{ success: boolean; sportIds: string[] }>(`/sports/favorites/${userId}`),
  ]);
  const ids = new Set(response.data.sportIds);
  return sports.filter((sport) => ids.has(sport.id)).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** POST /sports/:id/favorite — bascule ; renvoie true si le sport est maintenant favori. */
export async function toggleFavoriteSport(sportId: string): Promise<boolean> {
  const response = await api.post<{ success: boolean; favorited: boolean }>(`/sports/${sportId}/favorite`);
  return response.data.favorited;
}
