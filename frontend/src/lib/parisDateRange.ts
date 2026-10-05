/**
 * Bornes from/to (instants ISO, en UTC) des presets de date des listes
 * d'activités, calculées sur le calendrier Europe/Paris — jamais le fuseau
 * local du navigateur, qui peut différer du fuseau réel de l'app (visiteur
 * à l'étranger, horloge système mal configurée...). L'app ne vise que la
 * France : "aujourd'hui" doit toujours correspondre à 00:00:00→23:59:59.999
 * heure française, y compris pendant les changements d'heure été/hiver.
 *
 * Aucune dépendance ajoutée : Intl.DateTimeFormat avec `timeZone` suffit à
 * dériver le décalage Europe/Paris réel (DST inclus) à n'importe quel
 * instant, sans librairie de fuseaux horaires.
 *
 * Chaque preset (sauf "all") est une FENÊTRE CALENDAIRE intersectée avec
 * "à partir de maintenant" : les listes publiques ne montrent jamais le
 * passé, un preset ne doit donc jamais réintroduire une activité déjà
 * commencée plus tôt dans la période choisie.
 */

const PARIS_TZ = "Europe/Paris";

export type DatePreset = "all" | "today" | "tomorrow" | "week" | "weekend" | "month";

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "Toutes les dates",
  today: "Aujourd'hui",
  tomorrow: "Demain",
  week: "Cette semaine",
  weekend: "Ce week-end",
  month: "Ce mois-ci",
};

interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Décalage Europe/Paris (minutes, Paris − UTC) à l'instant donné — gère le DST. */
function parisOffsetMinutes(instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]));
  // Intl peut renvoyer "24" à minuit avec hour12:false selon l'environnement.
  const hour = parts.hour === "24" ? "00" : parts.hour;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - instant.getTime()) / 60000;
}

/** Année/mois/jour du calendrier Europe/Paris pour l'instant donné. */
function parisDateParts(instant: Date): DateParts {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(instant).map((p) => [p.type, p.value]));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/** Instant UTC correspondant à 00:00:00.000 heure de Paris pour cette date calendaire. */
function parisMidnightUtc({ year, month, day }: DateParts): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const offset = parisOffsetMinutes(new Date(naiveUtc));
  return new Date(naiveUtc - offset * 60000);
}

function addDays(parts: DateParts, days: number): DateParts {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function laterDate(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}

/** Intersecte [periodStart, periodEnd) avec [now, +∞) — jamais le passé. */
function clampToUpcoming(now: Date, periodStart: Date, periodEnd: Date): { from: string; to: string } {
  return {
    from: laterDate(now, periodStart).toISOString(),
    to: new Date(periodEnd.getTime() - 1).toISOString(),
  };
}

/**
 * Calcule `{ from, to }` (ISO, UTC) pour un preset donné. `to` est omis pour
 * "all" : toutes les activités à venir, sans borne haute.
 */
export function presetToRange(preset: DatePreset, now: Date = new Date()): { from?: string; to?: string } {
  const today = parisDateParts(now);

  switch (preset) {
    case "all":
      return { from: now.toISOString() };

    case "today": {
      const start = parisMidnightUtc(today);
      const end = parisMidnightUtc(addDays(today, 1));
      return clampToUpcoming(now, start, end);
    }

    case "tomorrow": {
      const tomorrow = addDays(today, 1);
      const start = parisMidnightUtc(tomorrow);
      const end = parisMidnightUtc(addDays(tomorrow, 1));
      // Toujours dans le futur par construction (demain > maintenant).
      return { from: start.toISOString(), to: new Date(end.getTime() - 1).toISOString() };
    }

    case "week": {
      // Semaine ISO : lundi → dimanche inclus.
      const dow = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay(); // 0=dimanche
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const monday = addDays(today, mondayOffset);
      const start = parisMidnightUtc(monday);
      const end = parisMidnightUtc(addDays(monday, 7));
      return clampToUpcoming(now, start, end);
    }

    case "weekend": {
      const dow = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
      const saturdayOffset = dow === 6 ? 0 : dow === 0 ? -1 : 6 - dow;
      const saturday = addDays(today, saturdayOffset);
      const start = parisMidnightUtc(saturday);
      const end = parisMidnightUtc(addDays(saturday, 2)); // lundi 00:00 = fin du dimanche inclus
      return clampToUpcoming(now, start, end);
    }

    case "month": {
      const start = parisMidnightUtc({ year: today.year, month: today.month, day: 1 });
      const nextMonth =
        today.month === 12
          ? { year: today.year + 1, month: 1, day: 1 }
          : { year: today.year, month: today.month + 1, day: 1 };
      const end = parisMidnightUtc(nextMonth);
      return clampToUpcoming(now, start, end);
    }

    default:
      return { from: now.toISOString() };
  }
}
