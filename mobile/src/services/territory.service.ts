import type { Territory } from "../types/domain";
import { api } from "./api";

export type { Territory };

interface TerritoriesResponse {
  success: boolean;
  territories: Territory[];
}

/** Territoires ouverts à l'inscription. */
export async function getTerritories(): Promise<Territory[]> {
  const response = await api.get<TerritoriesResponse>("/territories");

  return response.data.territories.filter((territory) => territory.isActive);
}

/** Territoires de l'utilisateur connecté, avec son territoire principal (isDefault). */
export async function getMyTerritories(): Promise<Territory[]> {
  const response = await api.get<TerritoriesResponse>("/territories/mine");

  return response.data.territories;
}

/** POST /territories/:code/join — rejoint un territoire ouvert (le principal ne change pas). */
export async function joinTerritory(code: string): Promise<void> {
  await api.post(`/territories/${encodeURIComponent(code)}/join`);
}
