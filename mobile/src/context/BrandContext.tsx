import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getBrand, type Brand } from "../constants/brands";
import { useTerritory } from "./TerritoryContext";

// Préférence d'affichage non sensible (code de territoire) : AsyncStorage
// convient, aucun jeton ni donnée personnelle ici.
const LAST_BRAND_KEY = "66partners.lastBrandCode";

const BrandContext = createContext<Brand>(getBrand(null));
// Vrai tant qu'aucun territoire n'est connu (app jamais connectée sur ce
// téléphone) : on affiche alors le logo principal plutôt que celui du 66.
const NeutralBrandContext = createContext<boolean>(true);

/** Fournit le thème d'un territoire précis (ex. aperçu à l'inscription). */
export function BrandProvider({
  code,
  children,
}: {
  code: string | null | undefined;
  children: React.ReactNode;
}) {
  const parent = useContext(BrandContext);
  const parentNeutral = useContext(NeutralBrandContext);
  const brand = code ? getBrand(code) : parent;
  return (
    <NeutralBrandContext.Provider value={code ? false : parentNeutral}>
      <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
    </NeutralBrandContext.Provider>
  );
}

/**
 * Thème de l'application : territoire actif de l'utilisateur connecté ; avant
 * connexion (y compris après une déconnexion), territoire PRINCIPAL
 * (isDefault) du dernier compte connecté sur ce téléphone — jamais le dernier
 * territoire actif choisi. 66 par défaut.
 */
export function TerritoryBrandProvider({ children }: { children: React.ReactNode }) {
  const { activeTerritory, territories } = useTerritory();
  const [lastCode, setLastCode] = useState<string | null>(null);
  const activeCode = activeTerritory?.code ?? null;
  const mainCode = territories.find((territory) => territory.isDefault)?.code ?? null;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LAST_BRAND_KEY)
      .then((code) => {
        // Ne remplace jamais le territoire principal déjà connu (lecture plus lente).
        if (!cancelled && code) setLastCode((current) => current ?? code);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Mémorise le territoire principal du compte connecté, sur le téléphone et
  // en mémoire (pour l'écran de connexion qui suit une déconnexion).
  useEffect(() => {
    if (!mainCode) return;
    AsyncStorage.setItem(LAST_BRAND_KEY, mainCode)
      .catch(() => undefined)
      .then(() => setLastCode(mainCode));
  }, [mainCode]);

  return <BrandProvider code={activeCode ?? lastCode}>{children}</BrandProvider>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}

/** Aucun territoire connu (thème 66 par défaut) : afficher le logo principal (MainLogo). */
export function useIsNeutralBrand(): boolean {
  return useContext(NeutralBrandContext);
}

/**
 * Feuille de styles dépendant du thème : `makeStyles(brand)` n'est recalculée
 * que si le territoire change (les objets Brand sont stables par code).
 */
export function useBrandStyles<T>(makeStyles: (brand: Brand) => T): T {
  const brand = useBrand();
  return useMemo(() => makeStyles(brand), [makeStyles, brand]);
}
