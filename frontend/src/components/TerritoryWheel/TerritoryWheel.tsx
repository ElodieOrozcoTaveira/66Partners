import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { TerritoryTheme } from "../../lib/territoryAssets";
import TerritoryBadge, { territoryStyle } from "../TerritoryBadge/TerritoryBadge";
import "./TerritoryWheel.scss";

const ITEM_HEIGHT = 46;
const VISIBLE_ROWS = 5;

/** Tri par numéro de département (« 09 » avant « 11 », codes non numériques à la fin). */
export function byDepartment(a: { code: string }, b: { code: string }): number {
  return a.code.localeCompare(b.code, "fr", { numeric: true });
}

interface WheelTerritory {
  id: string;
  code: string;
  brandName: string;
  name: string;
}

interface TerritoryWheelProps {
  territories: WheelTerritory[];
  themes: Record<string, TerritoryTheme>;
  value: string;
  /** Appelé quand la roulette s'arrête sur un territoire. */
  onChange: (code: string) => void;
  label: string;
}

/**
 * Roulette de sélection (téléphone) : 5 lignes visibles, le territoire au
 * centre est le territoire choisi.
 */
export default function TerritoryWheel({ territories, themes, value, onChange, label }: TerritoryWheelProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const initialIndex = Math.max(0, territories.findIndex((territory) => territory.code === value));
  const [centered, setCentered] = useState(initialIndex);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const index = Math.max(0, territories.findIndex((territory) => territory.code === value));
    if (Math.round(scroller.scrollTop / ITEM_HEIGHT) !== index) {
      scroller.scrollTop = index * ITEM_HEIGHT;
      setCentered(index);
    }
    // Uniquement à l'ouverture et si la valeur change de l'extérieur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(
    () => () => {
      window.clearTimeout(settleTimer.current);
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function indexFromScroll(): number {
    const scroller = scrollerRef.current;
    if (!scroller) return 0;
    return Math.min(territories.length - 1, Math.max(0, Math.round(scroller.scrollTop / ITEM_HEIGHT)));
  }

  function handleScroll() {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setCentered(indexFromScroll()));
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const territory = territories[indexFromScroll()];
      if (territory && territory.code !== value) onChange(territory.code);
    }, 140);
  }

  function scrollToIndex(index: number) {
    const clamped = Math.min(territories.length - 1, Math.max(0, index));
    scrollerRef.current?.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      scrollToIndex(centered + (event.key === "ArrowDown" ? 1 : -1));
    }
  }

  const active = territories[centered];

  return (
    <div
      className="territory-wheel"
      style={
        {
          ...territoryStyle(active ? themes[active.code] : undefined),
          "--wheel-item": `${ITEM_HEIGHT}px`,
          "--wheel-height": `${ITEM_HEIGHT * VISIBLE_ROWS}px`,
        } as CSSProperties
      }
    >
      <div className="territory-wheel__band" aria-hidden="true" />
      <div
        ref={scrollerRef}
        className="territory-wheel__scroller"
        role="listbox"
        aria-label={label}
        aria-activedescendant={active ? `territory-wheel-${active.code}` : undefined}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        {territories.map((territory, index) => {
          const distance = Math.min(Math.abs(index - centered), 3);
          return (
            <div
              key={territory.id}
              id={`territory-wheel-${territory.code}`}
              role="option"
              aria-selected={index === centered}
              className="territory-wheel__item"
              data-distance={distance}
              onClick={() => scrollToIndex(index)}
            >
              <TerritoryBadge code={territory.code} theme={themes[territory.code]} size="sm" />
              <span className="territory-wheel__texts">
                <span className="territory-wheel__brand">{territory.brandName}</span>
                {distance === 0 && <span className="territory-wheel__name">{territory.name}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
