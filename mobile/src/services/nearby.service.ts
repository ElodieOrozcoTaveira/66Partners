import type { Coordinates } from "../lib/geo";
import { api } from "./api";

export interface NearbyCount {
  count: number;
  radiusKm: number;
}

/**
 * POST /nearby — enregistre la position approximative (arrondie à ~1 km par
 * le serveur) et renvoie le nombre d'autres sportifs dans le rayon. Jamais
 * leurs positions.
 */
export async function shareLocationAndCount(position: Coordinates): Promise<NearbyCount> {
  // Arrondi dès le téléphone : la position exacte n'en sort jamais.
  const round = (value: number) => Math.round(value * 100) / 100;
  const response = await api.post<{ success: boolean } & NearbyCount>("/nearby", {
    latitude: round(position.latitude),
    longitude: round(position.longitude),
  });
  return { count: response.data.count, radiusKm: response.data.radiusKm };
}

/** DELETE /nearby/me — le serveur oublie la position. */
export async function forgetMyLocation(): Promise<void> {
  await api.delete("/nearby/me");
}
