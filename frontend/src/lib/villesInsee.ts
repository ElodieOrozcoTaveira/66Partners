/**
 * Recherche de communes via l'API Découpage administratif (data.gouv/INSEE),
 * restreinte au département 66 (Pyrénées-Orientales) — cœur du territoire 66Partners.
 * Doc : https://geo.api.gouv.fr/decoupage-administratif/communes
 *
 * Le département ne compte qu'environ 226 communes : plutôt que d'interroger
 * l'API à chaque frappe (latence réseau variable, parfois plusieurs secondes,
 * et recherche "nom=" peu tolérante aux abréviations comme "St-Cyprien"), on
 * récupère la liste complète une seule fois puis on filtre côté client.
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

interface IndexedVille extends VilleSuggestion {
  normalized: string;
}

let cache: IndexedVille[] | null = null;
let pendingFetch: Promise<IndexedVille[]> | null = null;

// Enlève les accents, uniformise la casse/les séparateurs, et développe les
// abréviations "St"/"Ste" en "Saint"/"Sainte" (les noms INSEE sont toujours
// écrits en toutes lettres, mais les utilisateurs tapent rarement ainsi).
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[-'\s]+/g, " ")
    .trim()
    .replace(/\bste\b/g, "sainte")
    .replace(/\bst\b/g, "saint");
}

function loadVilles66(): Promise<IndexedVille[]> {
  if (cache) return Promise.resolve(cache);
  if (pendingFetch) return pendingFetch;

  const url = new URL(GEO_API_URL);
  url.searchParams.set("codeDepartement", DEPARTEMENT_66);
  url.searchParams.set("fields", "nom,centre,codesPostaux");
  url.searchParams.set("limit", "500");

  pendingFetch = fetch(url.toString())
    .then((response) => {
      if (!response.ok) throw new Error("Liste des communes indisponible");
      return response.json() as Promise<GeoApiCommune[]>;
    })
    .then((communes) => {
      const indexed = communes
        .filter((commune) => commune.centre)
        .map((commune) => ({
          nom: commune.nom,
          codePostal: commune.codesPostaux?.[0] ?? null,
          longitude: commune.centre!.coordinates[0],
          latitude: commune.centre!.coordinates[1],
          normalized: normalize(commune.nom),
        }));
      cache = indexed;
      return indexed;
    })
    .finally(() => {
      pendingFetch = null;
    });

  return pendingFetch;
}

// À appeler tôt (ex. au montage du formulaire) pour que la liste soit déjà
// en cache au moment où l'utilisateur tape ses deux premiers caractères.
export function preloadVilles66(): void {
  loadVilles66().catch(() => {
    /* le préchargement échoue silencieusement, la recherche réessaiera au besoin */
  });
}

export async function searchVilles66(
  query: string,
  signal?: AbortSignal,
): Promise<VilleSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const villes = await loadVilles66();
  if (signal?.aborted) return [];

  const needle = normalize(trimmed);
  const words = needle.split(" ").filter(Boolean);

  return villes
    .filter((ville) => words.every((word) => ville.normalized.includes(word)))
    .sort((a, b) => {
      const aStarts = a.normalized.startsWith(needle) ? 0 : 1;
      const bStarts = b.normalized.startsWith(needle) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.nom.localeCompare(b.nom, "fr");
    })
    .slice(0, 8)
    .map(({ nom, codePostal, latitude, longitude }) => ({
      nom,
      codePostal,
      latitude,
      longitude,
    }));
}
