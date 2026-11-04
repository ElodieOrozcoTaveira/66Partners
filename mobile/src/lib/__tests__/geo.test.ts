import { DEFAULT_SEARCH_RADIUS_KM, distanceKm, isInRegion, nearbyLabel, regionForRadius } from "../geo";

const perpignan = { latitude: 42.6986, longitude: 2.8956 };
const montpellier = { latitude: 43.6108, longitude: 3.8767 };

describe("distanceKm", () => {
  it("vaut 0 pour un même point", () => {
    expect(distanceKm(perpignan, perpignan)).toBe(0);
  });

  it("donne la distance à vol d'oiseau Perpignan → Montpellier (~131 km)", () => {
    expect(distanceKm(perpignan, montpellier)).toBeGreaterThan(128);
    expect(distanceKm(perpignan, montpellier)).toBeLessThan(134);
  });
});

describe("regionForRadius", () => {
  it("cadre tout le cercle du rayon, marge comprise", () => {
    const region = regionForRadius(perpignan, DEFAULT_SEARCH_RADIUS_KM);
    expect(region.latitude).toBe(perpignan.latitude);
    // Demi-hauteur du cadre ≥ rayon.
    expect((region.latitudeDelta / 2) * 111.32).toBeGreaterThanOrEqual(DEFAULT_SEARCH_RADIUS_KM);
    // En longitude, les degrés sont plus courts : le delta est plus grand.
    expect(region.longitudeDelta).toBeGreaterThan(region.latitudeDelta);
  });
});

describe("isInRegion", () => {
  const pyreneesOrientales = { latitude: 42.6, longitude: 2.5, latitudeDelta: 0.75, longitudeDelta: 1.6 };

  it("reconnaît un point du département", () => {
    expect(isInRegion(perpignan, pyreneesOrientales)).toBe(true);
  });

  it("rejette un point hors du département", () => {
    expect(isInRegion(montpellier, pyreneesOrientales)).toBe(false);
  });
});

describe("nearbyLabel", () => {
  it("accorde au singulier et au pluriel", () => {
    expect(nearbyLabel(1, 15)).toBe("1 sportif dans un rayon de 15 km");
    expect(nearbyLabel(12, 15)).toBe("12 sportifs dans un rayon de 15 km");
  });

  it("reste encourageant quand personne n'est encore là", () => {
    expect(nearbyLabel(0, 15)).toBe("Aucun sportif dans un rayon de 15 km pour l'instant");
  });
});

it("le rayon par défaut est de 25 km", () => {
  expect(DEFAULT_SEARCH_RADIUS_KM).toBe(25);
});
