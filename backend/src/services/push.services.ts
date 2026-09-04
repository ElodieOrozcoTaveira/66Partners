import "dotenv/config";
import webpush from "web-push";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pushSubscriptions } from "../db/schema.js";
import { isUniqueViolation } from "../utils/db-errors.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE PUSH (Web Push)
 *
 * Gère les abonnements navigateur/PWA aux notifications push, et l'envoi
 * effectif via le protocole Web Push standard (clés VAPID). Ne stocke que le
 * strict nécessaire à l'envoi (endpoint + clés) — cf. politique de
 * confidentialité, section "Notifications push".
 *
 * L'abonnement est un consentement explicite de l'utilisateur (bouton
 * "Activer" côté frontend, jamais déclenché automatiquement) : ce service ne
 * fait qu'exécuter ce choix, il ne le décide jamais lui-même.
 */

const vapidConfigured =
  !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY && !!process.env.VAPID_SUBJECT;

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
} else {
  console.warn(
    "⚠️  VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT absents : les notifications push sont désactivées."
  );
}

export interface PushSubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export class PushService {
  static getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  static async subscribe(userId: string, subscription: PushSubscriptionKeys): Promise<void> {
    try {
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } catch (error) {
      // Le même navigateur peut renvoyer le même endpoint (ex. reload de la
      // page après un premier abonnement) : ce n'est pas une erreur, on garde
      // simplement l'abonnement existant tel quel.
      if (isUniqueViolation(error)) return;
      throw error;
    }
  }

  static async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
  }

  // Envoie une notification push à tous les appareils abonnés d'un utilisateur.
  // N'échoue jamais bruyamment : un envoi push est un "plus", jamais un
  // prérequis pour l'action qui le déclenche (cf. NotificationService.create).
  static async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!vapidConfigured) return;

    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            body
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          // 404/410 : le navigateur a révoqué l'abonnement (désinstallation,
          // nettoyage des données...) — on le retire pour ne pas réessayer
          // indéfiniment contre un endpoint mort (minimisation des données).
          if (statusCode === 404 || statusCode === 410) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id));
            return;
          }
          console.error("Erreur envoi push:", error);
        }
      })
    );
  }
}
