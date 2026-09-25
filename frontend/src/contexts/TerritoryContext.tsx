import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../lib/axios";
import {
  ASSET_CSS_VARS,
  THEME_CSS_VARS,
  TERRITORY_ASSET_KEYS,
  defaultTerritoryAsset,
  probeImage,
  territoryIn,
  territoryOf,
  loadTerritoryTheme,
  resolveTerritoryAsset,
  type TerritoryAssetKey,
} from "../lib/territoryAssets";
import { useAuth } from "./AuthContext";

export type Territory = {
  id: string;
  code: string;
  name: string;
  slug: string;
  brandName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  inseeDepartmentCode: string | null;
  tagline: string | null;
  assetsPath: string | null;
  isActive: boolean;
};

const ACTIVE_TERRITORY_STORAGE_KEY = "activeTerritoryCode";

// Territoires de test réservés au staging public (VITE_STAGING_TEST_TERRITORIES,
// injecté uniquement au build du staging — cf. docker-compose.staging.yml —
// jamais en dev/production, où la variable est absente). Permet au public
// testeur d'essayer le changement de contexte via TerritorySwitcher AVANT
// l'ouverture officielle d'un territoire (isActive reste false en base).
// Volontairement tenu à l'écart de `publicTerritories`/`joinableTerritories` :
// TerritorySwitcher est le SEUL endroit qui doit le proposer (jamais
// l'inscription ni une autre liste publique) — cf. `activeTerritory`
// ci-dessous et TerritorySwitcher.tsx pour les deux seuls usages autorisés.
const STAGING_TEST_TERRITORY_CODES = ((import.meta.env.VITE_STAGING_TEST_TERRITORIES as string | undefined) ?? "")
  .split(",")
  .map((code) => code.trim())
  .filter(Boolean);

type TerritoryContextType = {
  /** Territoires de l'utilisateur connecté (vide si non connecté ou non chargé). */
  territories: Territory[];
  /** Territoires actifs proposés publiquement (inscription, visiteurs). */
  publicTerritories: Territory[];
  /** Territoires de test staging (cf. STAGING_TEST_TERRITORY_CODES) — jamais
   *  actifs publiquement, à ne consommer que depuis TerritorySwitcher. */
  testTerritories: Territory[];
  /** Territoires parmi lesquels choisir le territoire actif : ceux de
   *  l'utilisateur connecté, sinon les territoires publics. */
  selectableTerritories: Territory[];
  /** Territoires actifs que l'utilisateur connecté n'a pas encore rejoints. */
  joinableTerritories: Territory[];
  /** Contexte d'utilisation courant (jamais une autre application) — sert à
   *  filtrer les appels API et à choisir le branding ; le backend revérifie
   *  systématiquement l'appartenance. */
  activeTerritory: Territory | null;
  setActiveTerritory: (code: string) => void;
  joinTerritory: (code: string) => Promise<void>;
  /** Assets du territoire actif réellement présents ; les autres retombent sur les assets 66. */
  availableAssets: ReadonlySet<TerritoryAssetKey>;
};

const TerritoryContext = createContext<TerritoryContextType | null>(null);

export function TerritoryProvider({ children }: { children: ReactNode }) {
  // Sur `token` (disponible dès le premier rendu, lu depuis localStorage) et
  // non `user` (qui n'existe qu'après la résolution de GET /api/users/me) :
  // le token seul suffit à authentifier cet appel côté backend, donc plus
  // besoin d'attendre /api/users/me pour le lancer — les deux partent
  // désormais en parallèle au lieu de s'enchaîner (cf. audit perf — P1).
  const { token } = useAuth();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [publicTerritories, setPublicTerritories] = useState<Territory[]>([]);
  const [testTerritories, setTestTerritories] = useState<Territory[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_TERRITORY_STORAGE_KEY),
  );

  useEffect(() => {
    api
      .get<{ territories: Territory[] }>("/api/territories")
      .then((res) => setPublicTerritories(res.data.territories.filter((t) => t.isActive)))
      .catch(() => setPublicTerritories([]));
  }, []);

  // GET /api/territories/:code n'est jamais filtré par isActive (contrairement
  // à GET /api/territories, cf. audit P-04) : seule route permettant de
  // résoudre les données réelles (branding, assets) d'un territoire de test
  // encore inactif, sans jamais élargir la liste publique elle-même.
  useEffect(() => {
    if (STAGING_TEST_TERRITORY_CODES.length === 0) return;
    let cancelled = false;
    Promise.all(
      STAGING_TEST_TERRITORY_CODES.map((code) =>
        api
          .get<{ territory: Territory }>(`/api/territories/${code}`)
          .then((res) => res.data.territory)
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      setTestTerritories(results.filter((t): t is Territory => t !== null));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMine = useCallback(() => {
    if (!token) {
      setTerritories([]);
      return Promise.resolve();
    }
    return api
      .get<{ territories: Territory[] }>("/api/territories/mine")
      .then((res) => setTerritories(res.data.territories))
      .catch(() => setTerritories([]));
  }, [token]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const selectableTerritories = token ? territories : publicTerritories;

  // Dernier territoire choisi s'il est encore sélectionnable, sinon le
  // premier renvoyé par l'API (ordre d'ancienneté) — aucun code en dur.
  // Repli sur `testTerritories` UNIQUEMENT si `activeCode` correspond déjà à
  // l'un d'eux (donc explicitement choisi via TerritorySwitcher à un moment
  // donné) : ne peut jamais devenir le territoire par défaut d'un nouveau
  // visiteur, seul `selectableTerritories[0]` sert de repli final.
  const activeTerritory =
    selectableTerritories.find((t) => t.code === activeCode) ??
    testTerritories.find((t) => t.code === activeCode) ??
    selectableTerritories[0] ??
    null;

  const joinableTerritories = token
    ? publicTerritories.filter((pt) => !territories.some((t) => t.id === pt.id))
    : [];

  function setActiveTerritory(code: string) {
    localStorage.setItem(ACTIVE_TERRITORY_STORAGE_KEY, code);
    setActiveCode(code);
  }

  async function joinTerritory(code: string) {
    await api.post(`/api/territories/${code}/join`);
    await loadMine();
  }

  const [availableAssets, setAvailableAssets] = useState<ReadonlySet<TerritoryAssetKey>>(new Set());

  // Repli automatique : un asset absent du dossier du territoire n'est jamais
  // utilisé (pas d'image cassée), on garde l'asset 66 correspondant.
  useEffect(() => {
    const assetsPath = activeTerritory?.assetsPath;
    const root = document.documentElement;
    setAvailableAssets(new Set());
    for (const cssVar of Object.values(ASSET_CSS_VARS)) root.style.removeProperty(cssVar);
    if (!assetsPath) return;

    let cancelled = false;
    Promise.all(
      TERRITORY_ASSET_KEYS.map(async (key) => {
        const url = resolveTerritoryAsset(assetsPath, key);
        return (await probeImage(url)) ? key : null;
      }),
    ).then((found) => {
      if (cancelled) return;
      const available = new Set(found.filter((key): key is TerritoryAssetKey => key !== null));
      setAvailableAssets(available);
      for (const [key, cssVar] of Object.entries(ASSET_CSS_VARS)) {
        if (available.has(key as TerritoryAssetKey)) {
          root.style.setProperty(cssVar, `url("${resolveTerritoryAsset(assetsPath, key as TerritoryAssetKey)}")`);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeTerritory?.assetsPath]);

  // Branding runtime : couleurs (variables CSS) et titre de l'onglet suivent
  // le territoire actif. Une seule PWA / un seul manifeste : seul le contenu
  // change, jamais l'URL ni l'application installée.
  useEffect(() => {
    if (!activeTerritory) return;
    let cancelled = false;
    const root = document.documentElement;

    document.title = activeTerritory.brandName;

    loadTerritoryTheme(activeTerritory.assetsPath).then((theme) => {
      if (cancelled) return;
      for (const [key, cssVar] of Object.entries(THEME_CSS_VARS)) {
        const value = theme[key as keyof typeof theme];
        if (value) root.style.setProperty(cssVar, value);
        else root.style.removeProperty(cssVar);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeTerritory?.code, activeTerritory?.assetsPath, activeTerritory?.brandName]);

  return (
    <TerritoryContext.Provider
      value={{
        territories,
        publicTerritories,
        testTerritories,
        selectableTerritories,
        joinableTerritories,
        activeTerritory,
        setActiveTerritory,
        joinTerritory,
        availableAssets,
      }}
    >
      {children}
    </TerritoryContext.Provider>
  );
}

export function useTerritory() {
  const ctx = useContext(TerritoryContext);
  if (!ctx) throw new Error("useTerritory must be used within TerritoryProvider");
  return ctx;
}

/**
 * Identité du territoire actif (nom de marque, accroche, région, code INSEE,
 * assets). Tant qu'aucun territoire n'est chargé : libellés neutres, jamais
 * une identité codée en dur.
 */
export function useBranding() {
  const { activeTerritory, availableAssets } = useTerritory();
  const sentences = (activeTerritory?.tagline ?? "").match(/[^.]+\./g)?.map((part) => part.trim()) ?? [];
  return {
    taglineLead: sentences.slice(0, -1).join(" "),
    taglineAccent: sentences.length > 0 ? sentences[sentences.length - 1]! : "",
    code: activeTerritory?.code ?? "",
    brandName: activeTerritory?.brandName ?? "Partners",
    territoryName: activeTerritory?.name ?? "",
    territoryOf: territoryOf(activeTerritory?.name ?? ""),
    territoryIn: territoryIn(activeTerritory?.name ?? ""),
    tagline: activeTerritory?.tagline ?? "",
    inseeDepartmentCode: activeTerritory?.inseeDepartmentCode ?? null,
    asset: (key: TerritoryAssetKey) =>
      availableAssets.has(key)
        ? resolveTerritoryAsset(activeTerritory?.assetsPath, key)
        : defaultTerritoryAsset(key),
  };
}
