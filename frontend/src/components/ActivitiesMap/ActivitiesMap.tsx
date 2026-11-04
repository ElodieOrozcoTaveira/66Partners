import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavLink } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

// Fonds de carte : configurable (fournisseur avec clé en prod), OpenStreetMap par défaut.
const TILE_URL =
  (import.meta.env.VITE_MAP_TILE_URL as string | undefined) || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  (import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined) ||
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

function regionBounds(region: MapRegion): L.LatLngBoundsExpression {
  return [
    [region.latitude - region.latitudeDelta / 2, region.longitude - region.longitudeDelta / 2],
    [region.latitude + region.latitudeDelta / 2, region.longitude + region.longitudeDelta / 2],
  ];
}

const iconCache = new Map<string, L.DivIcon>();

function sportIcon(sportName: string, selected: boolean): L.DivIcon {
  const key = `${sportName}|${selected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const { icon: Icon, color } = getSportVisual(sportName);
  const svg = renderToStaticMarkup(<Icon size={selected ? 20 : 17} strokeWidth={2.4} color={getIconColor(color)} />);
  const size = selected ? 46 : 38;
  const icon = L.divIcon({
    className: "activities-map__pin-wrapper",
    html: `<span class="activities-map__pin${selected ? " activities-map__pin--selected" : ""}" style="--pin:${color}">${svg}</span>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  });
  iconCache.set(key, icon);
  return icon;
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
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { points, missing } = useMemo(() => toMapPoints(activities), [activities]);
  const region = territoryRegion(territoryCode);
  const selected = activities.find((activity) => activity.id === selectedId) ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = L.map(container, { zoomControl: false, attributionControl: true });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 18, subdomains: "abc" }).addTo(map);
    map.attributionControl.setPrefix(false);
    map.on("click", () => setSelectedId(null));
    markersRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // La carte peut être montée dans un conteneur qui change de taille.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Cadrage : autour du membre s'il est dans le département, sinon le département.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userLocation && isInRegion(userLocation, region)) {
      map.fitBounds(
        L.latLng(userLocation.latitude, userLocation.longitude).toBounds(DEFAULT_SEARCH_RADIUS_KM * 2000),
      );
    } else {
      map.fitBounds(regionBounds(region));
    }
    // Recadrage seulement quand le territoire change ou que la position arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territoryCode, userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const { item, coordinate } of points) {
      const isSelected = item.id === selectedId;
      L.marker([coordinate.latitude, coordinate.longitude], {
        icon: sportIcon(item.sportName, isSelected),
        title: item.title,
        keyboard: true,
        zIndexOffset: isSelected ? 1000 : 0,
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          setSelectedId(item.id);
        })
        .addTo(layer);
    }
  }, [points, selectedId]);

  useEffect(() => {
    const layer = userLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!userLocation) return;
    const center: L.LatLngExpression = [userLocation.latitude, userLocation.longitude];
    // Les attributs SVG n'acceptent pas var(...) : couleur du territoire lue ici.
    const brandColor =
      getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim() || "#C4121A";
    L.circle(center, {
      radius: DEFAULT_SEARCH_RADIUS_KM * 1000,
      color: brandColor,
      weight: 1.5,
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(layer);
    L.circleMarker(center, {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#2563EB",
      fillOpacity: 1,
      interactive: false,
    }).addTo(layer);
  }, [userLocation]);

  useEffect(() => {
    if (selectedId && !activities.some((activity) => activity.id === selectedId)) setSelectedId(null);
  }, [activities, selectedId]);

  async function locate() {
    const coords = userLocation ?? (await onLocate());
    if (coords && mapRef.current) {
      mapRef.current.flyToBounds(
        L.latLng(coords.latitude, coords.longitude).toBounds(DEFAULT_SEARCH_RADIUS_KM * 2000),
        { duration: 0.8 },
      );
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
