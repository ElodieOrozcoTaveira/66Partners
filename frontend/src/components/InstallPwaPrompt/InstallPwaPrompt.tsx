import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import "./InstallPwaPrompt.scss";

const DISMISS_KEY = "66partners-pwa-install-dismissed-until";
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS n'expose pas display-mode, mais un flag dédié.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissedForNow(): boolean {
  const until = localStorage.getItem(DISMISS_KEY);
  return until !== null && Date.now() < Number(until);
}

// Le bandeau cookies (react-cookie-consent) occupe déjà le bas de l'écran
// tant que l'utilisateur n'a pas répondu : on attend qu'il ait choisi avant
// d'empiler notre propre bandeau par-dessus.
function hasCookieChoice(): boolean {
  return document.cookie.includes("66partners-cookie-consent=");
}

interface InstallPwaPromptProps {
  hasBottomNav?: boolean;
}

export default function InstallPwaPrompt({ hasBottomNav = false }: InstallPwaPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissedForNow() || !hasCookieChoice()) return;

    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua) && !("MSStream" in window);
    setIsIos(iosDevice);
    if (iosDevice) setIsVisible(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setIsVisible(false);
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div
      className={
        "install-pwa-prompt" + (hasBottomNav ? " install-pwa-prompt--with-bottom-nav" : "")
      }
    >
      <button
        type="button"
        className="install-pwa-prompt__close"
        onClick={dismiss}
        aria-label="Fermer"
      >
        <X size={16} />
      </button>

      {isIos ? (
        <>
          <p className="install-pwa-prompt__text">
            Installe 66Partners sur ton écran d'accueil pour un accès plus rapide et recevoir
            les notifications : appuie sur <Share size={14} className="install-pwa-prompt__icon" />{" "}
            puis « Sur l'écran d'accueil ».
          </p>
        </>
      ) : (
        <>
          <p className="install-pwa-prompt__text">
            Installe 66Partners sur ton téléphone pour un accès plus rapide et recevoir les
            notifications même en dehors du site.
          </p>
          <button type="button" className="install-pwa-prompt__btn" onClick={handleInstallClick}>
            <Download size={16} /> Installer
          </button>
        </>
      )}
    </div>
  );
}
