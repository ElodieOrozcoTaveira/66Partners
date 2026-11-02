import { and, eq } from "drizzle-orm";
import { activities, notifications, participations } from "../../src/db/schema.js";
import {
  ActivityReminderService,
  formatReminderWhen,
} from "../../src/services/activityReminder.services.js";
import { closeTestDb, createSport, createTerritory, createUser, resetAll, testDb } from "../helpers/db.js";

const HOUR = 60 * 60 * 1000;
// Instant de référence fixe : le 2 novembre 2026 à 10h00, heure de Paris.
const NOW = new Date("2026-11-02T09:00:00Z");

let sportId: string;
let territoryId: string;

beforeEach(async () => {
  await resetAll();
  sportId = await createSport("Course");
  territoryId = (await createTerritory({ code: "RM" })).id;
});

afterAll(async () => {
  await closeTestDb();
});

async function createActivity(
  creatorId: string,
  startsInMs: number,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" = "PENDING"
): Promise<string> {
  const [row] = await testDb
    .insert(activities)
    .values({
      title: "Sortie trail",
      city: "Toulouse",
      startDate: new Date(NOW.getTime() + startsInMs),
      levelRequired: "BEGINNER",
      maxParticipants: 6,
      status,
      sportId,
      creatorId,
      territoryId,
    })
    .returning({ id: activities.id });
  return row!.id;
}

async function join(activityId: string, userId: string, status: "PENDING" | "ACCEPTED" | "REFUSED") {
  await testDb.insert(participations).values({ activityId, userId, status });
}

async function remindersOf(userId: string) {
  return testDb
    .select({ contenu: notifications.contenu, activityId: notifications.activityId })
    .from(notifications)
    .where(and(eq(notifications.usersId, userId), eq(notifications.type, "ACTIVITY_REMINDER")));
}

describe("Rappels d'activité", () => {
  it("la veille : prévient l'organisateur et les participants acceptés, une seule fois", async () => {
    const creator = await createUser({ email: "orga@test.com" });
    const accepted = await createUser({ email: "ok@test.com" });
    const pending = await createUser({ email: "attente@test.com" });
    const refused = await createUser({ email: "refus@test.com" });
    const activityId = await createActivity(creator.userId, 20 * HOUR);
    await join(activityId, accepted.userId, "ACCEPTED");
    await join(activityId, pending.userId, "PENDING");
    await join(activityId, refused.userId, "REFUSED");

    expect(await ActivityReminderService.sendDueReminders(NOW)).toBe(2);
    // Une nouvelle vérification n'envoie rien de plus.
    expect(await ActivityReminderService.sendDueReminders(NOW)).toBe(0);

    const [creatorReminder] = await remindersOf(creator.userId);
    expect(creatorReminder).toMatchObject({ activityId });
    expect(creatorReminder!.contenu).toBe("Rappel : « Sortie trail » demain à 06h00 (Toulouse).");
    expect(await remindersOf(accepted.userId)).toHaveLength(1);
    expect(await remindersOf(pending.userId)).toHaveLength(0);
    expect(await remindersOf(refused.userId)).toHaveLength(0);
  });

  it("à moins de 2 h : seulement le rappel « 1 h avant », pas celui de la veille", async () => {
    const creator = await createUser({ email: "orga2@test.com" });
    await createActivity(creator.userId, 30 * 60 * 1000);

    expect(await ActivityReminderService.sendDueReminders(NOW)).toBe(1);
    const reminders = await remindersOf(creator.userId);
    expect(reminders).toHaveLength(1);
    expect(reminders[0]!.contenu).toBe("« Sortie trail » commence bientôt, à 10h30 (Toulouse).");
  });

  it("rien pour une activité lointaine, annulée ou déjà commencée", async () => {
    const creator = await createUser({ email: "orga3@test.com" });
    await createActivity(creator.userId, 3 * 24 * HOUR);
    await createActivity(creator.userId, 20 * HOUR, "CANCELLED");
    await createActivity(creator.userId, -1 * HOUR);

    expect(await ActivityReminderService.sendDueReminders(NOW)).toBe(0);
  });
});

describe("formatReminderWhen", () => {
  it("dit aujourd'hui, demain ou la date, à l'heure de Paris", () => {
    expect(formatReminderWhen(new Date("2026-11-02T17:30:00Z"), NOW)).toBe("aujourd'hui à 18h30");
    expect(formatReminderWhen(new Date("2026-11-03T08:00:00Z"), NOW)).toBe("demain à 09h00");
    expect(formatReminderWhen(new Date("2026-11-07T09:00:00Z"), NOW)).toBe("le samedi 7 novembre à 10h00");
  });
});
