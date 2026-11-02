import type { MapRegion } from "../constants/brands";

/** Rayon de recherche par défaut de l'onglet Explorer (même valeur que le serveur, cf. nearby.services.ts). */
export const DEFAULT_SEARCH_RADIUS_KM = 15;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_PER_LATITUDE_DEGREE = 111.32;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance à vol d'oiseau (formule de haversine), en km. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Cadrage de carte qui montre tout le cercle de `radiusKm` autour de
 * `center`, avec une petite marge pour que le bord du cercle reste visible.
 */
export function regionForRadius(center: Coordinates, radiusKm: number, margin = 1.2): MapRegion {
  const latitudeDelta = (2 * radiusKm * margin) / KM_PER_LATITUDE_DEGREE;
  const cosLat = Math.max(0.01, Math.cos(toRadians(center.latitude)));
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta,
    longitudeDelta: latitudeDelta / cosLat,
  };
}

/** Vrai si le point tombe dans le cadrage (le département du territoire). */
export function isInRegion(point: Coordinates, region: MapRegion): boolean {
  return (
    Math.abs(point.latitude - region.latitude) <= region.latitudeDelta / 2 &&
    Math.abs(point.longitude - region.longitude) <= region.longitudeDelta / 2
  );
}

/** Texte de la notification « sportifs autour de toi ». */
export function nearbyLabel(count: number, radiusKm: number): string {
  if (count === 0) return `Aucun sportif dans un rayon de ${radiusKm} km pour l'instant`;
  return `${count} sportif${count > 1 ? "s" : ""} dans un rayon de ${radiusKm} km`;
}
