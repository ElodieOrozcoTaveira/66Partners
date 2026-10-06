import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTerritory } from "../../contexts/TerritoryContext";
import { loadTerritoryTheme } from "../../lib/territoryAssets";
import "./TerritoryPicker.scss";

/**
 * Territoire principal choisi à l'inscription (classique ou via Google /
 * Facebook). Par défaut : le territoire actuellement affiché à l'écran.
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

// Repli identique à celui de variables.$rouge (couleur 66 par défaut) :
// un territoire sans theme.json (ex. le 66, assetsPath=null) n'a pas de
// couleur propre à afficher, donc on retombe sur la même teinte que le
// dégradé de marque par défaut.
const FALLBACK_SWATCH = "#E6392E";

/**
 * Un seul onglet affichant le territoire actuellement choisi, qui ouvre une
 * liste déroulante au clic (jamais plusieurs chips affichées côte à côte en
 * permanence) — même logique de choix que TerritorySwitcher, mais sans son
 * portail sur <body> : ce composant n'est utilisé que dans des modales
 * (inscription), jamais dans un contexte où un ancêtre transformé casserait
 * un position:fixed, donc une liste positionnée simplement en absolute dans
 * le flux de la modale (qui scrolle déjà elle-même, overflow-y: auto) suffit.
 */
export default function TerritoryPicker({ value, onChange, id }: TerritoryPickerProps) {
  const { publicTerritories, testTerritories } = useTerritory();
  const [swatches, setSwatches] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Territoires de test staging (cf. TerritoryContext) ajoutés à la liste
  // proposée à l'inscription — jamais dupliqués si déjà publics, jamais
  // prioritaires. Vide en dev/prod (VITE_STAGING_TEST_TERRITORIES absente),
  // donc sans aucun effet hors staging.
  const publicCodes = new Set(publicTerritories.map((territory) => territory.code));
  const visibleTerritories = [
    ...publicTerritories,
    ...testTerritories.filter((territory) => !publicCodes.has(territory.code)),
  ];
  const territoryCodes = visibleTerritories.map((territory) => territory.code).join(",");

  // Couleur de chaque territoire (fetch unique par territoire, mis en cache
  // par le navigateur) : purement décoratif (petit point de couleur sur
  // l'onglet et chaque option de la liste), n'affecte jamais le thème
  // global de l'app.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      visibleTerritories.map(async (territory) => {
        const theme = await loadTerritoryTheme(territory.assetsPath);
        return [territory.code, theme.primary ?? FALLBACK_SWATCH] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setSwatches(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territoryCodes]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (visibleTerritories.length < 2) return null;

  const selected = visibleTerritories.find((territory) => territory.code === value) ?? visibleTerritories[0]!;
  const selectedSwatch = swatches[selected.code] ?? FALLBACK_SWATCH;

  return (
    <div className="territory-picker" ref={containerRef}>
      <span id={`${id}-label`} className="territory-picker__label">
        Ton territoire principal
      </span>

      <button
        type="button"
        id={id}
        className="territory-picker__control"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        style={{ "--territory-swatch": selectedSwatch } as React.CSSProperties}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="territory-picker__dot" aria-hidden="true" />
        <span className="territory-picker__controlText">{selected.brandName}</span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={`territory-picker__chevron${open ? " territory-picker__chevron--open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="territory-picker__list" role="listbox" aria-labelledby={`${id}-label`}>
          {visibleTerritories.map((territory) => {
            const isActive = territory.code === value;
            return (
              <button
                key={territory.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`territory-picker__option${isActive ? " territory-picker__option--active" : ""}`}
                style={{ "--territory-swatch": swatches[territory.code] ?? FALLBACK_SWATCH } as React.CSSProperties}
                onClick={() => {
                  onChange(territory.code);
                  setOpen(false);
                }}
              >
                <span className="territory-picker__dot" aria-hidden="true" />
                <span>{territory.brandName}</span>
                {isActive && (
                  <Check size={14} strokeWidth={2.5} className="territory-picker__check" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
