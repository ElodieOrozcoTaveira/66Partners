import { useEffect, useState } from "react";
import { Download, EllipsisVertical, Share, SquarePlus, X } from "lucide-react";
import "./InstallPwaPrompt.scss";
import { useBranding } from "../../contexts/TerritoryContext";
import {
  PWA_INSTALL_AVAILABLE,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
} from "../../lib/pwaInstall";

// Délai laissé à Chrome/Android pour émettre nativement "beforeinstallprompt"
// avant de basculer sur l'instruction manuelle (heuristique d'engagement de
// Chrome, jamais garantie dès la première visite).
const ANDROID_FALLBACK_DELAY_MS = 4000;

const DISMISS_KEY = "66partners-pwa-install-dismissed-until";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS n'expose pas display-mode, mais un flag dédié.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isDismissedForNow(): boolean {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    return until !== null && Date.now() < Number(until);
  } catch {
    return false;
  }
}

// Le bandeau cookies occupe déjà le bas de l'écran tant que l'utilisateur
// n'a pas répondu : on attend qu'il ait choisi avant d'afficher le nôtre.
function hasCookieChoice(): boolean {
  return document.cookie.includes("66partners-cookie-consent=");
}

type Mode = "native" | "ios" | "android";

interface InstallPwaPromptProps {
  hasBottomNav?: boolean;
}

/**
 * Proposition d'installer le site comme une app (PWA) : bouton « Installer »
 * quand le navigateur le permet, sinon les étapes à suivre (iPhone, Android).
 */
export default function InstallPwaPrompt({ hasBottomNav = false }: InstallPwaPromptProps) {
  const { brandName } = useBranding();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    getDeferredInstallPrompt,
  );
  const [mode, setMode] = useState<Mode | null>(null);
  const [cookieAnswered, setCookieAnswered] = useState(hasCookieChoice);

  // Réponse au bandeau cookies après le montage (cf. Cookie.tsx).
  useEffect(() => {
    if (cookieAnswered) return;
    function handleCookieChanged() {
      setCookieAnswered(true);
    }
    window.addEventListener("cookie-consent-changed", handleCookieChanged);
    return () => window.removeEventListener("cookie-consent-changed", handleCookieChanged);
  }, [cookieAnswered]);

  useEffect(() => {
    if (isStandalone() || isDismissedForNow() || !cookieAnswered) return;

    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua) && !("MSStream" in window);
    const androidDevice = /android/i.test(ua);

    // Évènement déjà capté avant le montage (cf. lib/pwaInstall.ts).
    const early = getDeferredInstallPrompt();
    if (early) {
      setDeferredPrompt(early);
      setMode("native");
      return;
    }
    if (iosDevice) {
      setMode("ios");
      return;
    }

    function handleAvailable() {
      const event = getDeferredInstallPrompt();
      if (!event) return;
      setDeferredPrompt(event);
      setMode("native");
    }
    window.addEventListener(PWA_INSTALL_AVAILABLE, handleAvailable);

    let fallbackTimer: number | undefined;
    if (androidDevice) {
      fallbackTimer = window.setTimeout(() => {
        if (!getDeferredInstallPrompt()) setMode((current) => current ?? "android");
      }, ANDROID_FALLBACK_DELAY_MS);
    }

    return () => {
      window.removeEventListener(PWA_INSTALL_AVAILABLE, handleAvailable);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [cookieAnswered]);

  function dismiss() {
    setMode(null);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000));
    } catch {
      // Stockage indisponible : la proposition reviendra simplement plus tard.
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    clearDeferredInstallPrompt();
    setDeferredPrompt(null);
    setMode(null);
  }

  if (!mode) return null;

  return (
    <div
      className={"install-pwa-prompt" + (hasBottomNav ? " install-pwa-prompt--with-bottom-nav" : "")}
      role="dialog"
      aria-labelledby="install-pwa-title"
    >
      <button type="button" className="install-pwa-prompt__close" onClick={dismiss} aria-label="Fermer">
        <X size={16} />
      </button>

      <div className="install-pwa-prompt__head">
        <img className="install-pwa-prompt__app" src="/pwa-icon-192-v3.png" alt="" width={52} height={52} />
        <div>
          <p id="install-pwa-title" className="install-pwa-prompt__title">
            Installe {brandName}
          </p>
          <p className="install-pwa-prompt__text">
            Comme une app : ouverture en un geste depuis ton écran d'accueil, et les notifications de
            tes sorties.
          </p>
        </div>
      </div>

      {mode === "native" ? (
        <div className="install-pwa-prompt__actions">
          <button type="button" className="install-pwa-prompt__later" onClick={dismiss}>
            Plus tard
          </button>
          <button type="button" className="install-pwa-prompt__btn" onClick={handleInstallClick}>
            <Download size={17} /> Installer
          </button>
        </div>
      ) : (
        <ol className="install-pwa-prompt__steps">
          {mode === "ios" ? (
            <>
              <li>
                <span className="install-pwa-prompt__step-icon">
                  <Share size={16} />
                </span>
                Touche « Partager » en bas de Safari
              </li>
              <li>
                <span className="install-pwa-prompt__step-icon">
                  <SquarePlus size={16} />
                </span>
                Puis « Sur l'écran d'accueil »
              </li>
            </>
          ) : (
            <>
              <li>
                <span className="install-pwa-prompt__step-icon">
                  <EllipsisVertical size={16} />
                </span>
                Ouvre le menu de ton navigateur
              </li>
              <li>
                <span className="install-pwa-prompt__step-icon">
                  <Download size={16} />
                </span>
                Puis « Installer l'application »
              </li>
            </>
          )}
        </ol>
      )}
    </div>
  );
}
