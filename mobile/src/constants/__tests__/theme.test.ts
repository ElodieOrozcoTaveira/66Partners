import { Fonts, interForWeight } from "../theme";

describe("interForWeight", () => {
  it("choisit la police Inter de la bonne graisse", () => {
    expect(interForWeight(undefined)).toBe(Fonts.regular);
    expect(interForWeight("normal")).toBe(Fonts.regular);
    expect(interForWeight("500")).toBe(Fonts.medium);
    expect(interForWeight("600")).toBe(Fonts.semiBold);
    expect(interForWeight("bold")).toBe(Fonts.bold);
    expect(interForWeight(700)).toBe(Fonts.bold);
    expect(interForWeight("900")).toBe(Fonts.extraBold);
  });
});
