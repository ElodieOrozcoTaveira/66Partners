import api from "./axios";

/**
 * Aide côté client pour l'abonnement Web Push. Ne décide jamais elle-même
 * d'activer quoi que ce soit : chaque fonction exportée correspond à une
 * action explicitement déclenchée par l'utilisateur (bouton "Activer" /
 * "Désactiver"), jamais appelée automatiquement au chargement d'une page.
 */

export type PushSupportState =
  | "unsupported" // navigateur sans Push API (ex. Safari hors PWA installée)
  | "denied" // l'utilisateur a explicitement refusé la permission navigateur
  | "subscribed" // permission accordée + abonnement actif sur cet appareil
  | "available"; // permission pas encore demandée, ou accordée mais pas (ou plus) abonné

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushSupportState(): Promise<PushSupportState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  if (Notification.permission === "granted") {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? "subscribed" : "available";
  }

  return "available";
}

// Le VAPID public key est en base64url ; PushManager.subscribe veut un Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const { data } = await api.get<{ success: boolean; publicKey: string }>(
    "/api/push/vapid-public-key",
  );

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
  }

  const json = subscription.toJSON();
  await api.post("/api/push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
  });

  return true;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  await api.post("/api/push/unsubscribe", { endpoint }).catch(() => {
    // L'abonnement est de toute façon révoqué côté navigateur ; l'entrée
    // deviendra orpheline côté serveur mais sera nettoyée au premier envoi
    // raté (cf. PushService.sendToUser, statusCode 404/410).
  });
}
