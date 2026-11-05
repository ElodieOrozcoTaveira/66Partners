import { useCallback } from "react";
import { useTerritory } from "../contexts/TerritoryContext";
import { resolveTerritoryAsset } from "../lib/territoryAssets";

/**
 * Avatar par défaut du territoire d'un membre (et non du territoire affiché
 * à l'écran) : utilisé dans l'espace admin, où les membres viennent de tous
 * les territoires. Territoire inconnu : avatar par défaut du 66.
 */
export function useTerritoryAvatar() {
  const { publicTerritories, testTerritories } = useTerritory();
  return useCallback(
    (territoryCode: string | null | undefined) => {
      const territory = [...publicTerritories, ...testTerritories].find(
        (candidate) => candidate.code === territoryCode,
      );
      return resolveTerritoryAsset(territory?.assetsPath ?? null, "avatarDefault");
    },
    [publicTerritories, testTerritories],
  );
}
