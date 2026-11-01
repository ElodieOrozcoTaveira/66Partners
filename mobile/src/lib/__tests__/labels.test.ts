import { formatTimeSlot } from "../labels";
import { getSportVisual } from "../sportVisuals";

describe("formatTimeSlot", () => {
  it.each([
    ["18:00", "18h"],
    ["08:30", "8h30"],
    ["00:00", "0h"],
  ])("%s -> %s", (input, expected) => {
    expect(formatTimeSlot(input)).toBe(expected);
  });
});

describe("getSportVisual", () => {
  it("renvoie le visuel d'un sport connu", () => {
    expect(getSportVisual("Tennis").icon).toBe("tennis-ball");
  });

  it("retombe sur un visuel par défaut pour un sport ajouté en base", () => {
    expect(getSportVisual("Sport inconnu")).toEqual({ icon: "dumbbell", color: "#1F2937" });
  });
});
