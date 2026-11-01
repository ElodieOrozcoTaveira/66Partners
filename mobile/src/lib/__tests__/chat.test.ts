import { formatConversationTime, formatDaySeparator, isSameDay, mergeMessages } from "../chat";

const msg = (id: string, createdAt: string) => ({ id, createdAt });

describe("mergeMessages", () => {
  it("fusionne sans doublon, du plus récent au plus ancien", () => {
    const current = [msg("b", "2026-11-01T10:00:00Z"), msg("a", "2026-11-01T09:00:00Z")];
    const incoming = [msg("c", "2026-11-01T11:00:00Z"), msg("b", "2026-11-01T10:00:00Z")];
    expect(mergeMessages(current, incoming).map((m) => m.id)).toEqual(["c", "b", "a"]);
  });
});

describe("formatConversationTime", () => {
  const now = new Date("2026-11-01T15:00:00Z"); // 16h à Paris

  it("affiche l'heure le jour même", () => {
    expect(formatConversationTime("2026-11-01T09:24:00Z", now)).toBe("10:24");
  });

  it("affiche Hier la veille (calendrier de Paris)", () => {
    expect(formatConversationTime("2026-10-31T22:30:00Z", now)).toBe("Hier");
  });

  it("affiche la date au-delà", () => {
    expect(formatConversationTime("2026-09-12T10:00:00Z", now)).toBe("12/09");
  });
});

describe("séparateurs de jour", () => {
  const now = new Date("2026-11-01T15:00:00Z");

  it("nomme les jours", () => {
    expect(formatDaySeparator("2026-11-01T08:00:00Z", now)).toBe("Aujourd'hui");
    expect(formatDaySeparator("2026-10-31T08:00:00Z", now)).toBe("Hier");
    expect(formatDaySeparator("2026-10-29T08:00:00Z", now)).toBe("Jeudi 29 octobre");
  });

  it("compare les jours en heure de Paris", () => {
    // 23h30 et 9h le 31 octobre à Paris : même jour.
    expect(isSameDay("2026-10-31T22:30:00Z", "2026-10-31T08:00:00Z")).toBe(true);
    // 00h30 le 1er novembre à Paris contre 23h le 31 octobre : jours différents.
    expect(isSameDay("2026-10-31T23:30:00Z", "2026-10-31T22:00:00Z")).toBe(false);
  });
});
