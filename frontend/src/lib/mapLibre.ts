import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre 6 calcule la carte dans un fichier séparé (worker) : on le fait
// copier par Vite avec le site et on donne son adresse à MapLibre.
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

// Fonds de carte vectoriels OpenFreeMap : gratuits, sans clé ni cookies.
export const MAP_STYLE =
  (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) || "https://tiles.openfreemap.org/styles/liberty";

maplibregl.setWorkerUrl(mapWorkerUrl);

export { maplibregl };
