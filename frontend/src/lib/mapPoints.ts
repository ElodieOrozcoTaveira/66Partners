/**
 * Points de la carte de l'Explorer (même logique que l'app mobile). Les
 * activités n'ont que les coordonnées du centre de leur commune : plusieurs
 * activités d'une même commune sont réparties en cercle autour du point.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Locatable {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MapPoint<T> {
  item: T;
  coordinate: LatLng;
}

/** Rayon de répartition (~150 m) autour du centre de la commune. */
const SPREAD_DEGREES = 0.0015;

export function toMapPoints<T extends Locatable>(items: T[]): { points: MapPoint<T>[]; missing: number } {
  const groups = new Map<string, T[]>();
  let missing = 0;

  for (const item of items) {
    if (item.latitude == null || item.longitude == null) {
      missing += 1;
      continue;
    }
    const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  const points: MapPoint<T>[] = [];
  for (const group of groups.values()) {
    group.forEach((item, index) => {
      const base = { latitude: item.latitude!, longitude: item.longitude! };
      if (group.length === 1) {
        points.push({ item, coordinate: base });
        return;
      }
      const angle = (2 * Math.PI * index) / group.length;
      points.push({
        item,
        coordinate: {
          latitude: base.latitude + SPREAD_DEGREES * Math.sin(angle),
          longitude:
            base.longitude + (SPREAD_DEGREES * Math.cos(angle)) / Math.cos((base.latitude * Math.PI) / 180),
        },
      });
    });
  }
  return { points, missing };
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Cadrage de chaque département (identique à mobile/src/constants/brands.ts). */
const TERRITORY_REGIONS: Record<string, MapRegion> = {
  "66": { latitude: 42.6, longitude: 2.5, latitudeDelta: 0.75, longitudeDelta: 1.45 },
  "34": { latitude: 43.58, longitude: 3.4, latitudeDelta: 0.85, longitudeDelta: 1.5 },
  "11": { latitude: 43.05, longitude: 2.4, latitudeDelta: 0.95, longitudeDelta: 1.6 },
  "31": { latitude: 43.3, longitude: 1.25, latitudeDelta: 1.45, longitudeDelta: 1.75 },
  "32": { latitude: 43.68, longitude: 0.45, latitudeDelta: 0.95, longitudeDelta: 1.65 },
  "09": { latitude: 42.93, longitude: 1.5, latitudeDelta: 0.9, longitudeDelta: 1.5 },
  "30": { latitude: 43.98, longitude: 4.1, latitudeDelta: 1.15, longitudeDelta: 1.8 },
  "81": { latitude: 43.8, longitude: 2.2, latitudeDelta: 1.0, longitudeDelta: 1.6 },
  "82": { latitude: 44.08, longitude: 1.3, latitudeDelta: 0.8, longitudeDelta: 1.5 },
  "65": { latitude: 43.05, longitude: 0.15, latitudeDelta: 1.0, longitudeDelta: 1.0 },
  "46": { latitude: 44.62, longitude: 1.6, latitudeDelta: 0.9, longitudeDelta: 1.4 },
  "12": { latitude: 44.28, longitude: 2.65, latitudeDelta: 1.2, longitudeDelta: 1.6 },
  "48": { latitude: 44.52, longitude: 3.5, latitudeDelta: 0.9, longitudeDelta: 1.3 },
};

/** Occitanie entière, pour un territoire sans cadrage connu. */
const FALLBACK_REGION: MapRegion = { latitude: 43.7, longitude: 2.3, latitudeDelta: 2.6, longitudeDelta: 4.4 };

export function territoryRegion(code: string | undefined): MapRegion {
  return (code && TERRITORY_REGIONS[code]) || FALLBACK_REGION;
}

export function isInRegion(point: LatLng, region: MapRegion): boolean {
  return (
    Math.abs(point.latitude - region.latitude) <= region.latitudeDelta / 2 &&
    Math.abs(point.longitude - region.longitude) <= region.longitudeDelta / 2
  );
}
