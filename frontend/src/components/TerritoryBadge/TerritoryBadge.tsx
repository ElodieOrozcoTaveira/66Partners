import { useEffect, useState, type CSSProperties } from "react";
import { loadTerritoryTheme, type TerritoryTheme } from "../../lib/territoryAssets";
import "./TerritoryBadge.scss";

// Couleurs du 66 (territoire sans theme.json), identiques aux replis de
// variables.scss.
const DEFAULT_THEME: Required<TerritoryTheme> = {
  primary: "#C4121A",
  primaryDark: "#930D13",
  accent: "#FFCC00",
  accentDark: "#E0A800",
};

const themeCache = new Map<string, Promise<Required<TerritoryTheme>>>();

function themeFor(assetsPath: string | null): Promise<Required<TerritoryTheme>> {
  const key = assetsPath ?? "";
  let cached = themeCache.get(key);
  if (!cached) {
    cached = loadTerritoryTheme(assetsPath).then((theme) => ({ ...DEFAULT_THEME, ...theme }));
    themeCache.set(key, cached);
  }
  return cached;
}

interface ThemedTerritory {
  code: string;
  assetsPath: string | null;
}

/** Couleurs de chaque territoire (theme.json, chargé une seule fois par territoire). */
export function useTerritoryThemes(territories: ThemedTerritory[]) {
  const [themes, setThemes] = useState<Record<string, Required<TerritoryTheme>>>({});
  const signature = territories.map((territory) => `${territory.code}:${territory.assetsPath ?? ""}`).join(",");

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      territories.map(async (territory) => [territory.code, await themeFor(territory.assetsPath)] as const),
    ).then((entries) => {
      if (!cancelled) setThemes(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return themes;
}

/** Variables CSS d'un territoire, à poser sur un élément (vignette, option…). */
export function territoryStyle(theme: TerritoryTheme | undefined): CSSProperties {
  const colors = { ...DEFAULT_THEME, ...theme };
  return {
    "--t-primary": colors.primary,
    "--t-primary-dark": colors.primaryDark,
    "--t-accent": colors.accent,
  } as CSSProperties;
}

interface TerritoryBadgeProps {
  code: string;
  theme: TerritoryTheme | undefined;
  size?: "sm" | "md";
}

/** Vignette « maillot » : numéro du département sur les couleurs du territoire. */
export default function TerritoryBadge({ code, theme, size = "md" }: TerritoryBadgeProps) {
  return (
    <span className={`territory-badge territory-badge--${size}`} style={territoryStyle(theme)} aria-hidden="true">
      <span className="territory-badge__code">{code}</span>
    </span>
  );
}
