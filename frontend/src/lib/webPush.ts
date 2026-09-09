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
  | "available" // permission pas encore demandée, ou accordée mais pas (ou plus) abonné
  | "error"; // API supportée mais activation impossible (service worker, réseau...) — jamais un blocage silencieux

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// navigator.serviceWorker.ready ne se résout JAMAIS si le service worker n'a
// pas pu s'enregistrer (mauvais MIME type en dev, échec d'installation...) —
// sans ce timeout, tout appelant reste bloqué indéfiniment ("busy" qui ne
// retombe jamais), sans le moindre message d'erreur pour l'utilisateur.
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function readyServiceWorker(): Promise<ServiceWorkerRegistration> {
  return withTimeout(
    navigator.serviceWorker.ready,
    8000,
    "Le service worker n'a pas répondu à temps.",
  );
}

export async function getPushSupportState(): Promise<PushSupportState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  if (Notification.permission === "granted") {
    try {
      const registration = await readyServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      return subscription ? "subscribed" : "available";
    } catch (err) {
      console.error("getPushSupportState: service worker indisponible", err);
      return "error";
    }
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

  const registration = await readyServiceWorker();
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

  const registration = await readyServiceWorker();
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
