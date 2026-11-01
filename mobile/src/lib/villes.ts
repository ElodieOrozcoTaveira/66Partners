/**
 * Suggestions de communes du département du territoire (champ
 * `inseeDepartmentCode`), via l'API publique Découpage administratif
 * (geo.api.gouv.fr, sans clé ni suivi) — même source et même logique que le
 * web (frontend/src/lib/villesInsee.ts). La liste du département est chargée
 * une fois puis filtrée localement.
 */

const GEO_API_URL = "https://geo.api.gouv.fr/communes";

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

const cache = new Map<string, IndexedVille[]>();
const pending = new Map<string, Promise<IndexedVille[]>>();

/** Sans accents ni casse ; "St"/"Ste" développés en "Saint"/"Sainte". */
export function normalizeVille(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-'’\s]+/g, " ")
    .trim()
    .replace(/\bste\b/g, "sainte")
    .replace(/\bst\b/g, "saint");
}

function loadVilles(departmentCode: string): Promise<IndexedVille[]> {
  const cached = cache.get(departmentCode);
  if (cached) return Promise.resolve(cached);
  const inFlight = pending.get(departmentCode);
  if (inFlight) return inFlight;

  const url = `${GEO_API_URL}?codeDepartement=${encodeURIComponent(departmentCode)}&fields=nom,centre,codesPostaux&limit=500`;
  const request = fetch(url)
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
          normalized: normalizeVille(commune.nom),
        }));
      cache.set(departmentCode, indexed);
      return indexed;
    })
    .finally(() => {
      pending.delete(departmentCode);
    });

  pending.set(departmentCode, request);
  return request;
}

/** Précharge la liste (échec silencieux : la saisie libre reste possible). */
export function preloadVilles(departmentCode: string): void {
  loadVilles(departmentCode).catch(() => undefined);
}

export async function searchVilles(departmentCode: string, query: string): Promise<VilleSuggestion[]> {
  const needle = normalizeVille(query);
  if (needle.length < 2) return [];

  const villes = await loadVilles(departmentCode);
  const words = needle.split(" ").filter(Boolean);

  return villes
    .filter((ville) => words.every((word) => ville.normalized.includes(word)))
    .sort((a, b) => {
      const aStarts = a.normalized.startsWith(needle) ? 0 : 1;
      const bStarts = b.normalized.startsWith(needle) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.nom.localeCompare(b.nom, "fr");
    })
    .slice(0, 6)
    .map(({ nom, codePostal, latitude, longitude }) => ({ nom, codePostal, latitude, longitude }));
}

/** Réservé aux tests. */
export function __resetVillesCache(): void {
  cache.clear();
  pending.clear();
}
