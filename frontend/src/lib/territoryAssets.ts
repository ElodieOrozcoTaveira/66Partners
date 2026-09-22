// Assets d'un territoire, trouvés par convention de noms dans son dossier
// (`assetsPath`, ex. "/34partners" sous frontend/public). Un territoire sans
// `assetsPath` (le 66) utilise les assets par défaut, rangés sous
// frontend/public/66partners/. Ajouter un territoire = déposer ces fichiers
// dans son dossier, aucun code.

export type TerritoryAssetKey = "logo" | "hero" | "cover" | "landscape" | "emblem" | "avatarDefault";

const DEFAULT_ASSETS: Record<TerritoryAssetKey, string> = {
  logo: "/66partners/logo.webp",
  hero: "/66partners/hero.webp",
  cover: "/66partners/cover.webp",
  landscape: "/66partners/landscape.webp",
  emblem: "/66partners/emblem.webp",
  // Casse historique du fichier 66 (minuscules) — la convention par
  // territoire (TERRITORY_ASSET_FILES ci-dessous, "avatarDefault.webp") ne
  // s'applique qu'aux dossiers avec assetsPath, jamais à ce repli 66.
  avatarDefault: "/66partners/avatardefault.webp",
};

const TERRITORY_ASSET_FILES: Record<TerritoryAssetKey, string> = {
  logo: "logo.webp",
  hero: "hero.webp",
  cover: "cover.webp",
  landscape: "landscape.webp",
  emblem: "emblem.webp",
  avatarDefault: "avatarDefault.webp",
};

export const TERRITORY_ASSET_KEYS = Object.keys(DEFAULT_ASSETS) as TerritoryAssetKey[];

export function defaultTerritoryAsset(key: TerritoryAssetKey): string {
  return DEFAULT_ASSETS[key];
}

// Variables CSS pour les visuels utilisés en background dans les SCSS.
export const ASSET_CSS_VARS: Partial<Record<TerritoryAssetKey, string>> = {
  hero: "--brand-hero-image",
  emblem: "--brand-emblem-image",
};

const probeCache = new Map<string, Promise<boolean>>();

// Vrai si l'image existe réellement (un simple fetch ne suffit pas : le
// serveur peut répondre index.html en 200 pour un fichier absent).
export function probeImage(url: string): Promise<boolean> {
  let cached = probeCache.get(url);
  if (!cached) {
    cached = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    probeCache.set(url, cached);
  }
  return cached;
}

export function resolveTerritoryAsset(
  assetsPath: string | null | undefined,
  key: TerritoryAssetKey,
): string {
  return assetsPath ? `${assetsPath}/${TERRITORY_ASSET_FILES[key]}` : DEFAULT_ASSETS[key];
}

// Couleurs de marque du territoire, lues dans `<assetsPath>/theme.json` :
// { "primary": "#..", "primaryDark": "#..", "accent": "#..", "accentDark": "#.." }.
// Chaque clé absente garde la valeur par défaut (variables CSS en repli).
export interface TerritoryTheme {
  primary?: string;
  primaryDark?: string;
  accent?: string;
  accentDark?: string;
}

export const THEME_CSS_VARS: Record<keyof TerritoryTheme, string> = {
  primary: "--brand-primary",
  primaryDark: "--brand-primary-dark",
  accent: "--brand-accent",
  accentDark: "--brand-accent-dark",
};

const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

export async function loadTerritoryTheme(
  assetsPath: string | null | undefined,
): Promise<TerritoryTheme> {
  if (!assetsPath) return {};
  try {
    const response = await fetch(`${assetsPath}/theme.json`);
    if (!response.ok) return {};
    const raw = (await response.json()) as Record<string, unknown>;
    const theme: TerritoryTheme = {};
    for (const key of Object.keys(THEME_CSS_VARS) as (keyof TerritoryTheme)[]) {
      const value = raw[key];
      // Jamais de valeur arbitraire injectée dans le CSS : couleur hex uniquement.
      if (typeof value === "string" && HEX_COLOR.test(value)) theme[key] = value;
    }
    return theme;
  } catch {
    return {};
  }
}

// Article français devant un nom de territoire : "des Pyrénées-Orientales",
// "de l'Hérault", "de Corse" (heuristique : pluriel en -s, voyelle ou h initial).
function withArticle(name: string, prepositionSingular: "de" | "dans", plural: string, elided: string): string {
  if (!name) return "";
  if (/^[aeiouyhâêîôûéèë]/i.test(name)) return `${elided}${name}`;
  if (/s$/i.test(name)) return `${plural}${name}`;
  return `${prepositionSingular} ${name}`;
}

export function territoryOf(name: string): string {
  return withArticle(name, "de", "des ", "de l'");
}

export function territoryIn(name: string): string {
  return withArticle(name, "dans", "dans les ", "dans l'");
}
