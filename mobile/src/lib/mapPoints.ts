/**
 * Points de la carte de l'Explorer. Les activités n'ont que les coordonnées
 * du centre de leur commune : plusieurs activités d'une même commune se
 * superposeraient, on les répartit donc en cercle autour du point.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Locatable {
  id: string;
  latitude: number | null;
  longitude: number | null;
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
    if (item.latitude === null || item.longitude === null) {
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
          // Compense la convergence des méridiens pour garder un cercle.
          longitude:
            base.longitude + (SPREAD_DEGREES * Math.cos(angle)) / Math.cos((base.latitude * Math.PI) / 180),
        },
      });
    });
  }

  return { points, missing };
}
