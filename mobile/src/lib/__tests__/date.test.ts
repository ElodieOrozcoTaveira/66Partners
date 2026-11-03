import {
  calendarDaysFromNow,
  formatActivityWhen,
  formatMonthYear,
  formatRelativeTime,
  formatStartsIn,
  matchesDateFilter,
} from "../date";

describe("calendarDaysFromNow (calendrier Europe/Paris)", () => {
  it("compte en jours calendaires, pas en tranches de 24 h", () => {
    const now = new Date("2026-10-30T22:00:00Z"); // 23:00 à Paris
    const nextMorning = new Date("2026-10-31T06:00:00Z"); // 07:00 à Paris
    expect(calendarDaysFromNow(nextMorning, now)).toBe(1);
  });

  it("utilise l'heure de Paris même quand le jour UTC diffère", () => {
    // 23:30 UTC le 30 = 00:30 le 31 à Paris (heure d'hiver, UTC+1).
    const now = new Date("2026-10-30T10:00:00Z");
    const lateEvening = new Date("2026-10-30T23:30:00Z");
    expect(calendarDaysFromNow(lateEvening, now)).toBe(1);
  });

  it("gère le passage à l'heure d'hiver (25 octobre 2026)", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    const after = new Date("2026-10-26T12:00:00Z");
    expect(calendarDaysFromNow(after, now)).toBe(2);
  });
});

describe("formatActivityWhen", () => {
  const now = new Date("2026-10-30T08:00:00Z"); // vendredi 09:00 à Paris

  it("affiche « Aujourd'hui » avec l'heure de Paris", () => {
    expect(formatActivityWhen("2026-10-30T17:30:00Z", now)).toBe("Aujourd'hui · 18:30");
  });

  it("affiche « Demain »", () => {
    expect(formatActivityWhen("2026-10-31T08:00:00Z", now)).toBe("Demain · 09:00");
  });

  it("affiche le jour complet au-delà", () => {
    expect(formatActivityWhen("2026-11-03T09:00:00Z", now)).toBe("Mardi 3 novembre · 10:00");
  });
});

describe("matchesDateFilter", () => {
  // Jeudi 29 octobre 2026, 10h à Paris.
  const now = new Date("2026-10-29T09:00:00Z");

  it("garde tout avec 'all'", () => {
    expect(matchesDateFilter("2027-03-01T10:00:00Z", "all", now)).toBe(true);
  });

  it("'today' suit le jour calendaire de Paris", () => {
    expect(matchesDateFilter("2026-10-29T22:30:00Z", "today", now)).toBe(true); // 23h30 Paris
    expect(matchesDateFilter("2026-10-29T23:30:00Z", "today", now)).toBe(false); // 00h30 le 30
  });

  it("'weekend' ne retient que le samedi et le dimanche à venir", () => {
    expect(matchesDateFilter("2026-10-31T09:00:00Z", "weekend", now)).toBe(true); // samedi
    expect(matchesDateFilter("2026-11-01T09:00:00Z", "weekend", now)).toBe(true); // dimanche
    expect(matchesDateFilter("2026-10-30T09:00:00Z", "weekend", now)).toBe(false); // vendredi
    expect(matchesDateFilter("2026-11-07T09:00:00Z", "weekend", now)).toBe(false); // samedi suivant
  });

  it("'week' couvre aujourd'hui + 6 jours", () => {
    expect(matchesDateFilter("2026-11-04T09:00:00Z", "week", now)).toBe(true);
    expect(matchesDateFilter("2026-11-05T09:00:00Z", "week", now)).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-01T12:00:00Z");

  it("affiche les durées courtes", () => {
    expect(formatRelativeTime("2026-11-01T11:59:40Z", now)).toBe("à l'instant");
    expect(formatRelativeTime("2026-11-01T11:55:00Z", now)).toBe("il y a 5 min");
    expect(formatRelativeTime("2026-11-01T09:00:00Z", now)).toBe("il y a 3 h");
    expect(formatRelativeTime("2026-10-30T12:00:00Z", now)).toBe("il y a 2 j");
  });

  it("affiche la date au-delà d'une semaine", () => {
    expect(formatRelativeTime("2026-10-18T10:00:00Z", now)).toBe("Dimanche 18 octobre");
  });
});

describe("formatMonthYear", () => {
  it("affiche le mois et l'année à Paris", () => {
    expect(formatMonthYear("2026-10-31T23:30:00Z")).toBe("novembre 2026");
  });
});

describe("formatStartsIn", () => {
  // Mardi 3 novembre 2026, 10:00 à Paris (09:00 UTC).
  const now = new Date("2026-11-03T09:00:00Z");

  it("en minutes la dernière heure", () => {
    expect(formatStartsIn("2026-11-03T09:25:00Z", now)).toBe("Dans 25 min");
  });

  it("en heures le jour même", () => {
    expect(formatStartsIn("2026-11-03T17:30:00Z", now)).toBe("Dans 8 h");
  });

  it("demain, puis en jours, puis la date", () => {
    expect(formatStartsIn("2026-11-04T06:00:00Z", now)).toBe("Demain");
    expect(formatStartsIn("2026-11-07T09:00:00Z", now)).toBe("Dans 4 jours");
    expect(formatStartsIn("2026-11-20T09:00:00Z", now)).toBe("Vendredi 20 novembre");
  });

  it("une fois commencée", () => {
    expect(formatStartsIn("2026-11-03T08:30:00Z", now)).toBe("C'est parti !");
  });
});
