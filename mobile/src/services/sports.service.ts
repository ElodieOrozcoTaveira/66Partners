import { api } from "./api";

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

export async function getSports(): Promise<Sport[]> {
  const response = await api.get<SportsResponse>("/sports");

  return response.data.sports;
}