import { canJoinAudience, requiredGender } from "../audience";
import { buildActivityChanges, buildActivityPayload, formFromActivity, initialActivityForm } from "../activityForm";

describe("public d'une activité", () => {
  it("genre requis selon le public", () => {
    expect(requiredGender("ALL")).toBeNull();
    expect(requiredGender("WOMEN")).toBe("FEMALE");
    expect(requiredGender("MEN")).toBe("MALE");
  });

  it("peut-on demander à participer ?", () => {
    expect(canJoinAudience("ALL", null)).toBe(true);
    expect(canJoinAudience("WOMEN", "FEMALE")).toBe(true);
    expect(canJoinAudience("WOMEN", "MALE")).toBe(false);
    // Genre non renseigné : bouton affiché, le serveur demandera le genre.
    expect(canJoinAudience("WOMEN", null)).toBe(false);
    // Pas encore chargé : on laisse le serveur trancher.
    expect(canJoinAudience("MEN", undefined)).toBe(true);
  });
});

describe("formulaire d'activité et public", () => {
  it("ouverte à tous par défaut, envoyée à la création", () => {
    const form = initialActivityForm(new Date("2026-11-02T10:00:00Z"));
    expect(form.audience).toBe("ALL");
    expect(buildActivityPayload({ ...form, audience: "WOMEN" }).audience).toBe("WOMEN");
  });

  it("n'envoie le public en modification que s'il change", () => {
    const original = formFromActivity({
      sportId: "s",
      title: "Sortie",
      description: null,
      city: "Perpignan",
      latitude: null,
      longitude: null,
      startDate: "2026-11-10T10:00:00Z",
      levelRequired: "BEGINNER",
      maxParticipants: 4,
      carpoolEnabled: false,
      audience: "WOMEN",
    });
    expect(buildActivityChanges(original, original)).toEqual({});
    expect(buildActivityChanges(original, { ...original, audience: "ALL" })).toEqual({ audience: "ALL" });
  });
});
