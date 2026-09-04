import { z } from "zod";

/**
 * POST /push/subscribe
 * Payload standard renvoyé par `PushSubscription.toJSON()` côté navigateur.
 */
export const pushSubscribeSchema = z.object({
  endpoint: z.url("Endpoint d'abonnement invalide").max(2048),
  keys: z.object({
    p256dh: z.string().min(1, "Clé p256dh manquante"),
    auth: z.string().min(1, "Clé auth manquante"),
  }),
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

/**
 * POST /push/unsubscribe
 */
export const pushUnsubscribeSchema = z.object({
  endpoint: z.url("Endpoint d'abonnement invalide").max(2048),
});

export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;
