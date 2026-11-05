import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavLink } from "react-router-dom";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre 6 calcule la carte dans un fichier séparé (worker) : on le fait
// copier par Vite avec le site et on donne son adresse à MapLibre.
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { CalendarDays, ChevronRight, LocateFixed, MapPin, Users, X } from "lucide-react";
import { useBranding } from "../../contexts/TerritoryContext";
import { formatWhen } from "../../lib/dateFormat";
import { DEFAULT_SEARCH_RADIUS_KM, distanceKm, formatDistance, type Coordinates } from "../../lib/geo";
import { isInRegion, territoryRegion, toMapPoints, type MapRegion } from "../../lib/mapPoints";
import { getSportPhoto } from "../../lib/sportPhotos";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import "./ActivitiesMap.scss";

export interface MapActivity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  sportName: string;
  maxParticipants: number;
  participantsCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface ActivitiesMapProps {
  activities: MapActivity[];
  territoryCode: string | undefined;
  userLocation: Coordinates | null;
  /** Demande la position (autorisation navigateur) et la renvoie. */
  onLocate: () => Promise<Coordinates | null>;
  locating: boolean;
}

// Fonds de carte vectoriels OpenFreeMap : gratuits, sans clé ni cookies.
const MAP_STYLE =
  (import.meta.env.VITE_MAP_STYLE_URL as string | undefined) || "https://tiles.openfreemap.org/styles/liberty";

maplibregl.setWorkerUrl(mapWorkerUrl);

const USER_SOURCE = "user-radius";

function regionBounds(region: MapRegion): LngLatBoundsLike {
  return [
    [region.longitude - region.longitudeDelta / 2, region.latitude - region.latitudeDelta / 2],
    [region.longitude + region.longitudeDelta / 2, region.latitude + region.latitudeDelta / 2],
  ];
}

/** Carré englobant un cercle de `radiusKm` autour d'un point. */
function radiusBounds(center: Coordinates, radiusKm: number): LngLatBoundsLike {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180));
  return [
    [center.longitude - dLng, center.latitude - dLat],
    [center.longitude + dLng, center.latitude + dLat],
  ];
}

/** Cercle (polygone GeoJSON) du rayon de recherche. */
function radiusPolygon(center: Coordinates, radiusKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const steps = 64;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (2 * Math.PI * i) / steps;
    const dLat = (radiusKm / 111) * Math.sin(angle);
    const dLng = (radiusKm / (111 * Math.cos((center.latitude * Math.PI) / 180))) * Math.cos(angle);
    coordinates.push([center.longitude + dLng, center.latitude + dLat]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coordinates] } };
}

const iconMarkup = new Map<string, string>();

function pinElement(sportName: string, selected: boolean, title: string): HTMLElement {
  const key = `${sportName}|${selected}`;
  let svg = iconMarkup.get(key);
  const { icon: Icon, color } = getSportVisual(sportName);
  if (!svg) {
    svg = renderToStaticMarkup(<Icon size={selected ? 20 : 17} strokeWidth={2.4} color={getIconColor(color)} />);
    iconMarkup.set(key, svg);
  }
  const element = document.createElement("button");
  element.type = "button";
  element.className = "activities-map__pin-wrapper";
  element.setAttribute("aria-label", title);
  element.title = title;
  element.innerHTML = `<span class="activities-map__pin${selected ? " activities-map__pin--selected" : ""}" style="--pin:${color}">${svg}</span>`;
  return element;
}

/** Carte des activités de l'Explorer : un repère par activité, fiche en bas au clic. */
export default function ActivitiesMap({
  activities,
  territoryCode,
  userLocation,
  onLocate,
  locating,
}: ActivitiesMapProps) {
  const { brandName } = useBranding();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [styleReady, setStyleReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { points, missing } = useMemo(() => toMapPoints(activities), [activities]);
  const region = territoryRegion(territoryCode);
  const selected = activities.find((activity) => activity.id === selectedId) ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      bounds: regionBounds(region),
      fitBoundsOptions: { padding: 20 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", () => setSelectedId(null));
    map.on("load", () => setStyleReady(true));
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
    // Carte créée une seule fois ; le cadrage suit dans l'effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cadrage : autour du membre s'il est dans le département, sinon le département.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const target =
      userLocation && isInRegion(userLocation, region)
        ? radiusBounds(userLocation, DEFAULT_SEARCH_RADIUS_KM)
        : regionBounds(region);
    map.fitBounds(target, { padding: 20, animate: false });
    // Recadrage seulement quand le territoire change ou que la position arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territoryCode, userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = points.map(({ item, coordinate }) => {
      const isSelected = item.id === selectedId;
      const element = pinElement(item.sportName, isSelected, item.title);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        setSelectedId(item.id);
      });
      if (isSelected) element.style.zIndex = "2";
      return new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([coordinate.longitude, coordinate.latitude])
        .addTo(map);
    });
  }, [points, selectedId]);

  // Position du membre et cercle de 25 km.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: userLocation
        ? [
            radiusPolygon(userLocation, DEFAULT_SEARCH_RADIUS_KM),
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Point", coordinates: [userLocation.longitude, userLocation.latitude] },
            },
          ]
        : [],
    };
    const source = map.getSource(USER_SOURCE) as GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
      return;
    }
    const brandColor =
      getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim() || "#C4121A";
    map.addSource(USER_SOURCE, { type: "geojson", data });
    map.addLayer({
      id: "user-radius-fill",
      type: "fill",
      source: USER_SOURCE,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": brandColor, "fill-opacity": 0.06 },
    });
    map.addLayer({
      id: "user-radius-line",
      type: "line",
      source: USER_SOURCE,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "line-color": brandColor, "line-width": 1.5, "line-opacity": 0.7 },
    });
    map.addLayer({
      id: "user-position",
      type: "circle",
      source: USER_SOURCE,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 7,
        "circle-color": "#2563EB",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
      },
    });
  }, [userLocation, styleReady]);

  useEffect(() => {
    if (selectedId && !activities.some((activity) => activity.id === selectedId)) setSelectedId(null);
  }, [activities, selectedId]);

  async function locate() {
    const coords = userLocation ?? (await onLocate());
    if (coords && mapRef.current) {
      mapRef.current.fitBounds(radiusBounds(coords, DEFAULT_SEARCH_RADIUS_KM), { padding: 20, duration: 800 });
    }
  }

  const sportVisual = selected ? getSportVisual(selected.sportName) : null;
  const distance =
    selected && userLocation && selected.latitude != null && selected.longitude != null
      ? formatDistance(distanceKm(userLocation, { latitude: selected.latitude, longitude: selected.longitude }))
      : null;

  return (
    <div className="activities-map">
      <div ref={containerRef} className="activities-map__canvas" aria-label={`Carte des activités ${brandName}`} />

      <button
        type="button"
        className="activities-map__locate"
        onClick={() => void locate()}
        disabled={locating}
        aria-label="Me localiser"
        title="Me localiser"
      >
        <LocateFixed size={19} strokeWidth={2.4} />
      </button>

      {points.length === 0 && (
        <p className="activities-map__notice">Aucune activité à afficher sur la carte pour ces filtres.</p>
      )}
      {points.length > 0 && missing > 0 && !selected && (
        <p className="activities-map__notice">
          {missing === 1
            ? "1 activité sans lieu précis n'apparaît pas sur la carte."
            : `${missing} activités sans lieu précis n'apparaissent pas sur la carte.`}
        </p>
      )}

      {selected && sportVisual && (
        <div className="activities-map__sheet">
          <button
            type="button"
            className="activities-map__sheet-close"
            onClick={() => setSelectedId(null)}
            aria-label="Fermer"
          >
            <X size={16} strokeWidth={2.6} />
          </button>
          <NavLink to={`/activities/${selected.id}`} className="activities-map__card">
            <img src={getSportPhoto(selected.sportName)} alt="" className="activities-map__photo" />
            <span className="activities-map__card-body">
              <span className="activities-map__sport" style={{ color: sportVisual.color }}>
                <sportVisual.icon size={13} strokeWidth={2.6} />
                {selected.sportName}
              </span>
              <span className="activities-map__title">{selected.title}</span>
              <span className="activities-map__meta">
                <CalendarDays size={13} /> {formatWhen(new Date(selected.startDate))}
              </span>
              <span className="activities-map__meta">
                <MapPin size={13} /> {selected.city}
                {distance ? ` · ${distance}` : ""}
                <span className="activities-map__dot">·</span>
                <Users size={13} /> {selected.participantsCount}/{selected.maxParticipants}
              </span>
            </span>
            <ChevronRight size={18} className="activities-map__chevron" />
          </NavLink>
        </div>
      )}
    </div>
  );
}
