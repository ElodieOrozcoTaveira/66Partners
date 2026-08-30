/**
 * Recherche de communes via l'API Découpage administratif (data.gouv/INSEE),
 * restreinte au département 66 (Pyrénées-Orientales) — cœur du territoire 66Partners.
 * Doc : https://geo.api.gouv.fr/decoupage-administratif/communes
 */

const GEO_API_URL = "https://geo.api.gouv.fr/communes";
const DEPARTEMENT_66 = "66";

export interface VilleSuggestion {
  nom: string;
  codePostal: string | null;
  latitude: number;
  longitude: number;
}

interface GeoApiCommune {
  nom: string;
  codesPostaux?: string[];
  centre?: { coordinates: [number, number] };
}

export async function searchVilles66(
  query: string,
  signal?: AbortSignal,
): Promise<VilleSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEO_API_URL);
  url.searchParams.set("nom", trimmed);
  url.searchParams.set("codeDepartement", DEPARTEMENT_66);
  url.searchParams.set("fields", "nom,centre,codesPostaux");
  url.searchParams.set("boost", "population");
  url.searchParams.set("limit", "6");

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) throw new Error("Recherche de ville indisponible");

  const communes: GeoApiCommune[] = await response.json();

  return communes
    .filter((commune) => commune.centre)
    .map((commune) => ({
      nom: commune.nom,
      codePostal: commune.codesPostaux?.[0] ?? null,
      longitude: commune.centre!.coordinates[0],
      latitude: commune.centre!.coordinates[1],
    }));
}
