import {
  buildActivityChanges,
  buildActivityPayload,
  formFromActivity,
  initialActivityForm,
  MAX_PARTICIPANTS,
  validateActivityStep,
  type ActivityFormState,
} from "../activityForm";

const now = new Date("2026-10-31T10:00:00Z");

function validForm(): ActivityFormState {
  return {
    ...initialActivityForm(now),
    title: "Sortie trail - Pic du Canigou",
    sportId: "11111111-1111-4111-8111-111111111111",
    city: "Prades",
    dateChosen: true,
    timeChosen: true,
    startDate: new Date("2026-11-07T08:00:00Z"),
  };
}

describe("initialActivityForm", () => {
  it("propose une date future et 8 participants comme le web", () => {
    const form = initialActivityForm(now);
    expect(form.startDate.getTime()).toBeGreaterThan(now.getTime());
    expect(form.maxParticipants).toBe(8);
    expect(form.dateChosen).toBe(false);
  });
});

describe("validateActivityStep", () => {
  it("accepte un formulaire complet", () => {
    expect(validateActivityStep(3, validForm(), now)).toBeNull();
  });

  it("étape 1 : titre et sport obligatoires", () => {
    expect(validateActivityStep(1, { ...validForm(), title: "  " }, now)).toMatch(/titre/);
    expect(validateActivityStep(1, { ...validForm(), sportId: "" }, now)).toMatch(/sport/);
    expect(validateActivityStep(1, { ...validForm(), title: "x".repeat(151) }, now)).toMatch(/150/);
  });

  it("étape 1 ne vérifie pas encore le lieu ni la date", () => {
    expect(validateActivityStep(1, { ...validForm(), city: "", dateChosen: false }, now)).toBeNull();
  });

  it("étape 2 : lieu, date choisie et future, participants bornés", () => {
    expect(validateActivityStep(2, { ...validForm(), city: "" }, now)).toMatch(/lieu/);
    expect(validateActivityStep(2, { ...validForm(), timeChosen: false }, now)).toMatch(/heure/);
    expect(
      validateActivityStep(2, { ...validForm(), startDate: new Date("2026-10-31T09:00:00Z") }, now)
    ).toMatch(/futur/);
    expect(validateActivityStep(2, { ...validForm(), maxParticipants: 1 }, now)).toMatch(/participants/);
    expect(
      validateActivityStep(2, { ...validForm(), maxParticipants: MAX_PARTICIPANTS + 1 }, now)
    ).toMatch(/participants/);
  });
});

describe("buildActivityPayload", () => {
  it("nettoie les champs et omet les valeurs vides", () => {
    const payload = buildActivityPayload({ ...validForm(), title: "  Trail  ", description: "   " });
    expect(payload.title).toBe("Trail");
    expect(payload).not.toHaveProperty("description");
    expect(payload).not.toHaveProperty("latitude");
    expect(payload).not.toHaveProperty("territoryId");
    expect(payload.startDate).toBe("2026-11-07T08:00:00.000Z");
  });

  it("transmet les coordonnées de la commune et le territoire", () => {
    const payload = buildActivityPayload(
      { ...validForm(), latitude: 42.6, longitude: 2.4 },
      "22222222-2222-4222-8222-222222222222"
    );
    expect(payload).toMatchObject({ latitude: 42.6, longitude: 2.4 });
    expect(payload.territoryId).toBe("22222222-2222-4222-8222-222222222222");
  });
});

describe("modification", () => {
  const activity = {
    sportId: "s1",
    title: "Trail",
    description: null,
    city: "Prades",
    latitude: 42.6,
    longitude: 2.4,
    startDate: "2026-11-07T08:00:00.000Z",
    levelRequired: "INTERMEDIATE" as const,
    maxParticipants: 8,
    carpoolEnabled: false,
  };

  it("pré-remplit un formulaire valide", () => {
    const form = formFromActivity(activity);
    expect(form.description).toBe("");
    expect(form.dateChosen && form.timeChosen).toBe(true);
    expect(validateActivityStep(3, form, now)).toBeNull();
  });

  it("n'envoie rien si rien ne change", () => {
    const original = formFromActivity(activity);
    expect(buildActivityChanges(original, { ...original, title: " Trail " })).toEqual({});
  });

  it("n'envoie que les champs modifiés, lieu et coordonnées ensemble", () => {
    const original = formFromActivity(activity);
    const changes = buildActivityChanges(original, {
      ...original,
      city: "Céret",
      latitude: null,
      longitude: null,
      maxParticipants: 10,
      description: "  Rythme tranquille ",
    });
    expect(changes).toEqual({
      city: "Céret",
      latitude: null,
      longitude: null,
      maxParticipants: 10,
      description: "Rythme tranquille",
    });
    expect(changes).not.toHaveProperty("startDate");
  });

  it("efface la description vidée", () => {
    const original = formFromActivity({ ...activity, description: "Ancienne" });
    expect(buildActivityChanges(original, { ...original, description: "" })).toEqual({ description: null });
  });
});

describe("validation en modification", () => {
  const past = { ...validForm(), startDate: new Date("2026-10-30T08:00:00Z") };

  it("tolère une date passée inchangée", () => {
    expect(validateActivityStep(3, past, now)).toMatch(/futur/);
    expect(validateActivityStep(3, past, now, { requireFutureDate: false })).toBeNull();
  });

  it("refuse moins de places que de participants acceptés", () => {
    expect(validateActivityStep(3, { ...validForm(), maxParticipants: 4 }, now, { minParticipants: 5 })).toMatch(
      /déjà acceptés/
    );
  });
});
