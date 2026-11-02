import "dotenv/config";
import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, activityReminders, participations } from "../db/schema.js";
import { NotificationService } from "./notification.services.js";

const db = drizzle(process.env.DATABASE_URL!);

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export type ReminderKind = "DAY" | "HOUR";

interface ReminderRule {
  kind: ReminderKind;
  /** Le rappel part dès que le début est à moins de `leadMs`… */
  leadMs: number;
  /** … et tant qu'il reste plus de `minAheadMs` (sinon c'est le rappel suivant). */
  minAheadMs: number;
}

// La veille (24 h avant), puis 1 h avant. Le rappel de la veille n'est plus
// envoyé à moins de 2 h du début : le rappel "1 h avant" prend le relais,
// pour ne jamais recevoir deux rappels presque en même temps.
const RULES: ReminderRule[] = [
  { kind: "DAY", leadMs: 24 * HOUR, minAheadMs: 2 * HOUR },
  { kind: "HOUR", leadMs: 1 * HOUR, minAheadMs: 0 },
];

// Heures affichées à l'heure de France, quel que soit le fuseau du serveur.
const TIME_ZONE = "Europe/Paris";
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const dayKeyFormat = new Intl.DateTimeFormat("fr-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const longDayFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });

function formatTime(date: Date): string {
  return timeFormat.format(date).replace(":", "h");
}

/** « aujourd'hui à 18h30 », « demain à 9h00 » ou « le samedi 8 novembre à 10h00 ». */
export function formatReminderWhen(start: Date, now: Date): string {
  const time = formatTime(start);
  const startDay = dayKeyFormat.format(start);
  if (startDay === dayKeyFormat.format(now)) return `aujourd'hui à ${time}`;
  if (startDay === dayKeyFormat.format(new Date(now.getTime() + 24 * HOUR))) return `demain à ${time}`;
  return `le ${longDayFormat.format(start)} à ${time}`;
}

export function reminderMessage(
  kind: ReminderKind,
  activity: { title: string; city: string | null; startDate: Date },
  now: Date
): string {
  const place = activity.city ? ` (${activity.city})` : "";
  return kind === "HOUR"
    ? `« ${activity.title} » commence bientôt, à ${formatTime(activity.startDate)}${place}.`
    : `Rappel : « ${activity.title} » ${formatReminderWhen(activity.startDate, now)}${place}.`;
}

/**
 * SERVICE RAPPELS D'ACTIVITÉ
 *
 * Prévient l'organisateur et les participants acceptés avant le début d'une
 * activité (la veille, puis 1 h avant), par une notification classique (in-app
 * + push web). Appelé régulièrement par startActivityReminderScheduler.
 * Chaque rappel est d'abord inscrit dans activity_reminders : seul celui qui
 * l'inscrit l'envoie, donc jamais de doublon.
 */
export class ActivityReminderService {
  /** Envoie les rappels dus à l'instant `now`. Renvoie le nombre envoyé. */
  static async sendDueReminders(now: Date = new Date()): Promise<number> {
    let sent = 0;

    for (const rule of RULES) {
      const dueActivities = await db
        .select({
          id: activities.id,
          title: activities.title,
          city: activities.city,
          startDate: activities.startDate,
          creatorId: activities.creatorId,
        })
        .from(activities)
        .where(
          and(
            inArray(activities.status, ["PENDING", "CONFIRMED"]),
            gt(activities.startDate, new Date(now.getTime() + rule.minAheadMs)),
            lte(activities.startDate, new Date(now.getTime() + rule.leadMs))
          )
        );
      if (dueActivities.length === 0) continue;

      const accepted = await db
        .select({ activityId: participations.activityId, userId: participations.userId })
        .from(participations)
        .where(
          and(
            inArray(
              participations.activityId,
              dueActivities.map((activity) => activity.id)
            ),
            eq(participations.status, "ACCEPTED")
          )
        );

      for (const activity of dueActivities) {
        const recipients = new Set(
          accepted.filter((row) => row.activityId === activity.id).map((row) => row.userId)
        );
        if (activity.creatorId) recipients.add(activity.creatorId);
        if (recipients.size === 0) continue;

        // Réserve les rappels : seuls ceux réellement insérés partent.
        const reserved = await db
          .insert(activityReminders)
          .values([...recipients].map((userId) => ({ activityId: activity.id, userId, kind: rule.kind })))
          .onConflictDoNothing()
          .returning({ userId: activityReminders.userId });

        const contenu = reminderMessage(rule.kind, activity, now);
        for (const { userId } of reserved) {
          try {
            await NotificationService.create({
              usersId: userId,
              type: "ACTIVITY_REMINDER",
              contenu,
              activityId: activity.id,
            });
            sent += 1;
          } catch (error) {
            console.error("Erreur rappel d'activité:", error);
          }
        }
      }
    }

    return sent;
  }
}

const CHECK_INTERVAL_MS = 5 * MINUTE;

/**
 * Lance la vérification périodique des rappels (toutes les 5 min). Jamais en
 * test. Une vérification ne démarre pas tant que la précédente tourne.
 */
export function startActivityReminderScheduler(): void {
  if (process.env.NODE_ENV === "test") return;

  let running = false;
  const tick = () => {
    if (running) return;
    running = true;
    ActivityReminderService.sendDueReminders()
      .catch((error) => console.error("Erreur vérification des rappels d'activité:", error))
      .finally(() => {
        running = false;
      });
  };

  setTimeout(tick, 30 * 1000).unref();
  setInterval(tick, CHECK_INTERVAL_MS).unref();
}
