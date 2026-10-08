import { api } from "./api";

export interface Territory {
  id: string;
  code: string;
  name: string;
  slug: string;
  brandName: string;
  inseeDepartmentCode: string;
  tagline: string;
  assetsPath: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TerritoriesResponse {
  success: boolean;
  territories: Territory[];
}

export async function getTerritories(): Promise<Territory[]> {
  const response = await api.get<TerritoriesResponse>("/territories");

  return response.data.territories.filter(
    (territory) => territory.isActive
  );
}
