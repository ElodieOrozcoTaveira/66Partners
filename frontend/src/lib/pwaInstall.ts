/**
 * Capture précoce de l'évènement « beforeinstallprompt » (Chrome, Edge,
 * Android) : il n'est émis qu'une fois, souvent dès le chargement, avant que
 * le composant InstallPwaPrompt ne soit monté (il attend en plus la réponse
 * au bandeau cookies). Sans cette capture, l'évènement était perdu et la
 * proposition d'installation n'apparaissait jamais sur ordinateur.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWA_INSTALL_AVAILABLE = "pwa-install-available";

let deferred: BeforeInstallPromptEvent | null = null;

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferred;
}

export function clearDeferredInstallPrompt(): void {
  deferred = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event(PWA_INSTALL_AVAILABLE));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
  });
}
