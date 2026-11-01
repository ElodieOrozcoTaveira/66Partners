import { __resetVillesCache, normalizeVille, searchVilles } from "../villes";

const COMMUNES = [
  { nom: "Saint-Cyprien", codesPostaux: ["66750"], centre: { coordinates: [3.0, 42.6] } },
  { nom: "Perpignan", codesPostaux: ["66000"], centre: { coordinates: [2.89, 42.69] } },
  { nom: "Prades", codesPostaux: ["66500"], centre: { coordinates: [2.42, 42.62] } },
  { nom: "Sans centre" },
];

beforeEach(() => {
  __resetVillesCache();
  globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => COMMUNES })) as unknown as typeof fetch;
});

describe("normalizeVille", () => {
  it("ignore accents, casse et abréviations", () => {
    expect(normalizeVille("St-Cyprien")).toBe("saint cyprien");
    expect(normalizeVille("Élne")).toBe("elne");
  });
});

describe("searchVilles", () => {
  it("trouve une commune avec une abréviation", async () => {
    const results = await searchVilles("66", "st cyp");
    expect(results.map((r) => r.nom)).toEqual(["Saint-Cyprien"]);
    expect(results[0]).toMatchObject({ codePostal: "66750", latitude: 42.6, longitude: 3.0 });
  });

  it("ne cherche pas avant 2 caractères et ne charge la liste qu'une fois", async () => {
    expect(await searchVilles("66", "p")).toEqual([]);
    await searchVilles("66", "pr");
    await searchVilles("66", "per");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("ignore les communes sans coordonnées", async () => {
    expect(await searchVilles("66", "sans")).toEqual([]);
  });
});
