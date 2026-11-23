import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavLink } from "react-router-dom";
import { isAxiosError } from "axios";
import type { LngLatBoundsLike, Map as MapLibreMap, Marker } from "maplibre-gl";
import { EyeOff, MapPin, Pencil, ShieldCheck, Users, X } from "lucide-react";
import api from "../../lib/axios";
import { LEVEL_LABELS, type ActivityLevel } from "../../lib/activityLabels";
import { MAP_STYLE, maplibregl } from "../../lib/mapLibre";
import { territoryRegion } from "../../lib/mapPoints";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import { preloadVilles, searchVilles, type VilleSuggestion } from "../../lib/villesInsee";
import { useBranding } from "../../contexts/TerritoryContext";
import "../ActivitiesMap/ActivitiesMap.scss";
import "./MembersAround.scss";

interface Visibility {
  inseeCode: string;
  sectorName: string;
  showAge: boolean;
  consentedAt: string;
}

interface MapMember {
  id: string;
  pseudo: string;
  avatar: string | null;
  age: number | null;
  sectorName: string;
  lookingFor: string | null;
  latitude: number;
  longitude: number;
  sports: { id: string; name: string; level: ActivityLevel }[];
}

function apiMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message ?? fallback;
  return fallback;
}

/** Écran de consentement, aussi utilisé pour changer de secteur. */
function VisibilityForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Visibility | null;
  onSaved: (visibility: Visibility) => void;
  onCancel?: () => void;
}) {
  const { inseeDepartmentCode, territoryName } = useBranding();
  const [query, setQuery] = useState(initial?.sectorName ?? "");
  const [commune, setCommune] = useState<{ code: string; nom: string } | null>(
    initial ? { code: initial.inseeCode, nom: initial.sectorName } : null,
  );
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);
  const [showAge, setShowAge] = useState(initial?.showAge ?? false);
  const [consent, setConsent] = useState(initial !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inseeDepartmentCode) preloadVilles(inseeDepartmentCode);
  }, [inseeDepartmentCode]);

  useEffect(() => {
    if (!inseeDepartmentCode || commune || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchVilles(inseeDepartmentCode, query, controller.signal)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, commune, inseeDepartmentCode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!commune || !consent) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<{ visibility: Visibility }>("/api/discovery/me", {
        inseeCode: commune.code,
        showAge,
        consent: true,
      });
      onSaved(res.data.visibility);
    } catch (err) {
      setError(apiMessage(err, "Impossible d'enregistrer ton choix. Réessaie plus tard."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="members-optin" onSubmit={(event) => void submit(event)}>
      <span className="members-optin__icon">
        <Users size={24} />
      </span>
      <h2 className="members-optin__title">
        {initial ? "Modifier mon secteur" : "Découvre les sportifs autour de toi"}
      </h2>
      {!initial && (
        <p className="members-optin__text">
          Pour voir les autres sportifs, apparais toi aussi sur la carte. C'est toi qui décides, et tu
          peux te retirer à tout moment.
        </p>
      )}

      <ul className="members-optin__rules">
        <li><ShieldCheck size={16} /> Visible uniquement par les membres connectés qui sont aussi sur la carte</li>
        <li><ShieldCheck size={16} /> Pin placé autour du centre de ta commune : jamais ton adresse</li>
        <li><ShieldCheck size={16} /> Les membres que tu bloques ne te voient pas</li>
      </ul>

      <label className="members-optin__label" htmlFor="members-sector">
        Ton secteur {territoryName ? `(${territoryName})` : ""}
      </label>
      <div className="members-optin__search">
        <input
          id="members-sector"
          type="text"
          autoComplete="off"
          placeholder="Ex. Perpignan"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCommune(null);
          }}
        />
        {suggestions.length > 0 && (
          <ul className="members-optin__suggestions">
            {suggestions.map((ville) => (
              <li key={ville.code}>
                <button
                  type="button"
                  onClick={() => {
                    setCommune({ code: ville.code, nom: ville.nom });
                    setQuery(ville.nom);
                    setSuggestions([]);
                  }}
                >
                  {ville.nom}
                  {ville.codePostal ? <small>{ville.codePostal}</small> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="members-optin__hint">
        Tu habites un petit village ? Choisis plutôt une ville proche : son nom sera affiché sur ta fiche.
      </p>

      <label className="members-optin__check">
        <input type="checkbox" checked={showAge} onChange={(event) => setShowAge(event.target.checked)} />
        Afficher mon âge (facultatif)
      </label>
      <label className="members-optin__check">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>
          J'accepte d'apparaître sur la carte avec mon pseudo, ma photo, mes sports et niveaux, ce que je
          recherche et mon secteur.{" "}
          <NavLink to="/confidentialite" target="_blank">En savoir plus</NavLink>
        </span>
      </label>

      {error && <p className="members-optin__error" role="alert">{error}</p>}

      <div className="members-optin__actions">
        <button type="submit" className="btn btn--primary" disabled={!commune || !consent || saving}>
          {saving ? "Enregistrement…" : initial ? "Enregistrer" : "Apparaître sur la carte"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}

const sportIconMarkup = new Map<string, string>();

/** Construit en DOM (pas d'innerHTML pour les données d'un membre). */
function memberPin(member: MapMember, selected: boolean, fallbackAvatar: string): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `members-pin${selected ? " members-pin--selected" : ""}`;
  button.setAttribute("aria-label", `Voir la fiche de ${member.pseudo}`);
  button.title = member.pseudo;

  const image = document.createElement("img");
  image.alt = "";
  image.src = member.avatar || fallbackAvatar;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallbackAvatar;
  };
  button.appendChild(image);

  const sport = member.sports[0];
  if (sport) {
    const { icon: Icon, color } = getSportVisual(sport.name);
    let svg = sportIconMarkup.get(sport.name);
    if (!svg) {
      svg = renderToStaticMarkup(<Icon size={11} strokeWidth={2.6} color={getIconColor(color)} />);
      sportIconMarkup.set(sport.name, svg);
    }
    const badge = document.createElement("span");
    badge.className = "members-pin__sport";
    badge.style.backgroundColor = color;
    badge.innerHTML = svg;
    button.appendChild(badge);
  }
  return button;
}

function MembersMap({ members, territoryCode }: { members: MapMember[]; territoryCode: string | undefined }) {
  const { asset, brandName } = useBranding();
  const fallbackAvatar = asset("avatarDefault");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId],
  );

  const bounds = useMemo<LngLatBoundsLike>(() => {
    if (members.length === 0) {
      const region = territoryRegion(territoryCode);
      return [
        [region.longitude - region.longitudeDelta / 2, region.latitude - region.latitudeDelta / 2],
        [region.longitude + region.longitudeDelta / 2, region.latitude + region.latitudeDelta / 2],
      ];
    }
    const box = new maplibregl.LngLatBounds();
    members.forEach((member) => box.extend([member.longitude, member.latitude]));
    return box;
  }, [members, territoryCode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      bounds,
      fitBoundsOptions: { padding: 60, maxZoom: 10 },
      // Pas de zoom de rue : les positions ne sont que des zones.
      maxZoom: 12,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", () => setSelectedId(null));
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // Carte créée une seule fois ; le cadrage suit dans l'effet suivant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.fitBounds(bounds, { padding: 60, maxZoom: 10, animate: false });
  }, [bounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = members.map((member) => {
      const isSelected = member.id === selectedId;
      const element = memberPin(member, isSelected, fallbackAvatar);
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        setSelectedId(member.id);
      });
      if (isSelected) element.style.zIndex = "2";
      return new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([member.longitude, member.latitude])
        .addTo(map);
    });
  }, [members, selectedId, fallbackAvatar]);

  return (
    <div className="activities-map">
      <div ref={containerRef} className="activities-map__canvas" aria-label={`Carte des sportifs ${brandName}`} />

      {members.length === 0 && (
        <p className="activities-map__notice">Personne d'autre n'est encore visible autour de toi.</p>
      )}

      {selected && (
        <div className="activities-map__sheet">
          <button
            type="button"
            className="activities-map__sheet-close"
            onClick={() => setSelectedId(null)}
            aria-label="Fermer"
          >
            <X size={16} strokeWidth={2.6} />
          </button>
          <article className="member-sheet">
            <header className="member-sheet__head">
              <img
                src={selected.avatar || fallbackAvatar}
                alt=""
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackAvatar;
                }}
              />
              <div>
                <h3>
                  {selected.pseudo}
                  {selected.age !== null ? `, ${selected.age} ans` : ""}
                </h3>
                <p>
                  <MapPin size={13} /> À proximité de {selected.sectorName}
                </p>
              </div>
            </header>
            {selected.sports.length > 0 && (
              <ul className="member-sheet__sports">
                {selected.sports.map((sport) => {
                  const { icon: Icon, color } = getSportVisual(sport.name);
                  return (
                    <li key={sport.id} title={LEVEL_LABELS[sport.level]}>
                      <Icon size={13} color={color} /> {sport.name}
                      <small>{LEVEL_LABELS[sport.level]}</small>
                    </li>
                  );
                })}
              </ul>
            )}
            {selected.lookingFor && <blockquote>« {selected.lookingFor} »</blockquote>}
            <div className="member-sheet__actions">
              <NavLink to={`/profile/${selected.id}`} className="btn btn--primary member-sheet__cta">
                Voir le profil
              </NavLink>
              <NavLink to={`/profile/${selected.id}#activites`} className="btn btn--light member-sheet__cta">
                Voir ses activités
              </NavLink>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

/** Onglet « Sportifs » de l'Explorer : consentement, puis carte des membres. */
export default function MembersAround({ territoryCode }: { territoryCode: string | undefined }) {
  // undefined = chargement ; null = le membre n'est pas visible.
  const [visibility, setVisibility] = useState<Visibility | null | undefined>(undefined);
  const [members, setMembers] = useState<MapMember[]>([]);
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const res = await api.get<{ members: MapMember[] }>("/api/discovery/members");
      setMembers(res.data.members);
      setError(null);
    } catch (err) {
      setError(apiMessage(err, "Impossible de charger les sportifs autour de toi."));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ visibility: Visibility | null }>("/api/discovery/me")
      .then((res) => {
        if (cancelled) return;
        setVisibility(res.data.visibility);
        if (res.data.visibility) void loadMembers();
      })
      .catch((err) => {
        if (cancelled) return;
        setVisibility(null);
        setError(apiMessage(err, "Impossible de charger ce service pour le moment."));
      });
    return () => {
      cancelled = true;
    };
  }, [loadMembers]);

  async function leaveMap() {
    setLeaving(true);
    try {
      await api.delete("/api/discovery/me");
      setVisibility(null);
      setMembers([]);
      setError(null);
    } catch (err) {
      setError(apiMessage(err, "Impossible de te retirer de la carte. Réessaie."));
    } finally {
      setLeaving(false);
    }
  }

  if (visibility === undefined) return <p className="explorer-state">Chargement...</p>;

  if (!visibility || editing) {
    return (
      <>
        {error && !visibility && <p className="members-bar__error" role="alert">{error}</p>}
        <VisibilityForm
          initial={visibility}
          onCancel={visibility ? () => setEditing(false) : undefined}
          onSaved={(saved) => {
            setVisibility(saved);
            setEditing(false);
            void loadMembers();
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="members-bar">
        <span className="members-bar__status">
          <span className="members-bar__dot" /> Tu es visible · {visibility.sectorName}
        </span>
        <span className="members-bar__count">
          <Users size={15} /> {members.length} sportif{members.length > 1 ? "s" : ""}
        </span>
        <span className="members-bar__actions">
          <button type="button" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Modifier
          </button>
          <button type="button" onClick={() => void leaveMap()} disabled={leaving}>
            <EyeOff size={14} /> {leaving ? "Retrait…" : "Me retirer"}
          </button>
        </span>
      </div>
      {error && <p className="members-bar__error" role="alert">{error}</p>}
      <MembersMap members={members} territoryCode={territoryCode} />
    </>
  );
}
