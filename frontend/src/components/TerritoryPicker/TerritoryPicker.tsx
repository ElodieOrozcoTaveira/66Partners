import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useTerritory } from "../../contexts/TerritoryContext";
import TerritoryBadge, { territoryStyle, useTerritoryThemes } from "../TerritoryBadge/TerritoryBadge";
import TerritoryWheel, { byDepartment } from "../TerritoryWheel/TerritoryWheel";
import { PHONE_QUERY, useMediaQuery } from "../../hooks/useMediaQuery";
import "./TerritoryPicker.scss";

/**
 * Territoire principal choisi à l'inscription (classique ou via Google).
 * Par défaut : le territoire actuellement affiché à l'écran.
 * Le composant ne s'affiche que si plusieurs territoires actifs existent ;
 * sinon le seul territoire actif est utilisé sans rien demander.
 */
export function useSignupTerritory() {
  const { activeTerritory } = useTerritory();
  const [chosen, setChosen] = useState<string | null>(null);
  const territoryCode = chosen ?? activeTerritory?.code;
  return { territoryCode, setTerritoryCode: setChosen };
}

interface TerritoryPickerProps {
  value: string | undefined;
  onChange: (code: string) => void;
  id: string;
}

/** Au-delà, un champ de recherche apparaît en tête de liste. */
const SEARCH_THRESHOLD = 6;

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Bouton affichant le territoire choisi, qui déplie la liste dans le flux de
 * la modale (une liste en surimpression était coupée par le bas de la
 * modale qui défile).
 */
export default function TerritoryPicker({ value, onChange, id }: TerritoryPickerProps) {
  const { publicTerritories, testTerritories } = useTerritory();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isPhone = useMediaQuery(PHONE_QUERY);

  // Territoires de test staging (cf. TerritoryContext) ajoutés en dernier,
  // jamais dupliqués ; vide hors staging.
  const visibleTerritories = useMemo(() => {
    const publicCodes = new Set(publicTerritories.map((territory) => territory.code));
    return [...publicTerritories, ...testTerritories.filter((territory) => !publicCodes.has(territory.code))].sort(
      byDepartment,
    );
  }, [publicTerritories, testTerritories]);
  const themes = useTerritoryThemes(visibleTerritories);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return visibleTerritories;
    return visibleTerritories.filter((territory) =>
      [territory.code, territory.name, territory.brandName].some((text) => normalize(text).includes(needle)),
    );
  }, [query, visibleTerritories]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (!isPhone && visibleTerritories.length > SEARCH_THRESHOLD) searchRef.current?.focus({ preventScroll: true });

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, visibleTerritories.length, isPhone]);

  if (visibleTerritories.length < 2) return null;

  const selected = visibleTerritories.find((territory) => territory.code === value) ?? visibleTerritories[0]!;

  return (
    <div className="territory-picker" ref={containerRef}>
      <span id={`${id}-label`} className="territory-picker__label">
        Ton territoire principal
      </span>

      <button
        type="button"
        id={id}
        className={`territory-picker__control${open ? " territory-picker__control--open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        style={territoryStyle(themes[selected.code])}
        onClick={() => setOpen((prev) => !prev)}
      >
        <TerritoryBadge code={selected.code} theme={themes[selected.code]} />
        <span className="territory-picker__texts">
          <span className="territory-picker__brand">{selected.brandName}</span>
          <span className="territory-picker__name">{selected.name}</span>
        </span>
        <span className="territory-picker__chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2.6} />
        </span>
      </button>

      {open && isPhone && (
        <div className="territory-picker__panel">
          <TerritoryWheel
            territories={visibleTerritories}
            themes={themes}
            value={selected.code}
            onChange={onChange}
            label="Territoires disponibles"
          />
          <button
            type="button"
            className="territory-picker__confirm"
            style={territoryStyle(themes[selected.code])}
            onClick={() => setOpen(false)}
          >
            Choisir {selected.brandName}
          </button>
        </div>
      )}

      {open && !isPhone && (
        <div className="territory-picker__panel">
          {visibleTerritories.length > SEARCH_THRESHOLD && (
            <label className="territory-picker__search">
              <Search size={15} strokeWidth={2.4} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Département ou numéro…"
                aria-label="Rechercher un territoire"
                autoComplete="off"
              />
            </label>
          )}

          <div className="territory-picker__list" role="listbox" aria-labelledby={`${id}-label`}>
            {filtered.length === 0 ? (
              <p className="territory-picker__empty">Aucun territoire ne correspond.</p>
            ) : (
              filtered.map((territory) => {
                const isActive = territory.code === value;
                return (
                  <button
                    key={territory.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`territory-picker__option${isActive ? " territory-picker__option--active" : ""}`}
                    style={territoryStyle(themes[territory.code])}
                    onClick={() => {
                      onChange(territory.code);
                      setOpen(false);
                    }}
                  >
                    <TerritoryBadge code={territory.code} theme={themes[territory.code]} />
                    <span className="territory-picker__texts">
                      <span className="territory-picker__brand">{territory.brandName}</span>
                      <span className="territory-picker__name">{territory.name}</span>
                    </span>
                    <span className="territory-picker__check" aria-hidden="true">
                      {isActive && <Check size={13} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
