/** Rayon de recherche par défaut (même valeur que le serveur, cf. backend nearby.services.ts). */
export const DEFAULT_SEARCH_RADIUS_KM = 50;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance à vol d'oiseau (haversine), en km. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "< 1 km", "4 km" */
export function formatDistance(km: number): string {
  return km < 1 ? "< 1 km" : `${Math.round(km)} km`;
}

/** Texte de la pastille « sportifs autour de toi ». */
export function nearbyLabel(count: number, radiusKm: number): string {
  if (count === 0) return `Aucun sportif dans un rayon de ${radiusKm} km pour l'instant`;
  return `${count} sportif${count > 1 ? "s" : ""} dans un rayon de ${radiusKm} km`;
}
