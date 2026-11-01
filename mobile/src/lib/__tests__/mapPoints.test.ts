import { toMapPoints } from "../mapPoints";

const at = (id: string, latitude: number | null, longitude: number | null) => ({ id, latitude, longitude });

describe("toMapPoints", () => {
  it("garde la position exacte d'une activité seule", () => {
    const { points, missing } = toMapPoints([at("a", 42.69, 2.89)]);
    expect(missing).toBe(0);
    expect(points[0].coordinate).toEqual({ latitude: 42.69, longitude: 2.89 });
  });

  it("compte les activités sans coordonnées", () => {
    const { points, missing } = toMapPoints([at("a", null, null), at("b", 42.6, null), at("c", 43, 3)]);
    expect(points.map((p) => p.item.id)).toEqual(["c"]);
    expect(missing).toBe(2);
  });

  it("répartit les activités d'une même commune sans les superposer", () => {
    const { points } = toMapPoints([at("a", 42.69, 2.89), at("b", 42.69, 2.89), at("c", 42.69, 2.89)]);
    const keys = new Set(points.map((p) => `${p.coordinate.latitude},${p.coordinate.longitude}`));
    expect(keys.size).toBe(3);
    for (const point of points) {
      expect(Math.abs(point.coordinate.latitude - 42.69)).toBeLessThan(0.003);
      expect(Math.abs(point.coordinate.longitude - 2.89)).toBeLessThan(0.003);
    }
  });
});
