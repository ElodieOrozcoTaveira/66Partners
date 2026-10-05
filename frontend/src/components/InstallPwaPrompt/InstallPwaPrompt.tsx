import { useEffect, useRef, useState } from "react";
import { Download, Share, MoreVertical, X } from "lucide-react";
import "./InstallPwaPrompt.scss";
import { useBranding } from "../../contexts/TerritoryContext";

// Délai laissé à Chrome/Android pour émettre nativement "beforeinstallprompt"
// avant de basculer sur l'instruction manuelle — cf. heuristique d'engagement
// ci-dessous.
const ANDROID_FALLBACK_DELAY_MS = 4000;

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
  const { brandName } = useBranding();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isAndroidFallback, setIsAndroidFallback] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cookieAnswered, setCookieAnswered] = useState(hasCookieChoice);
  // Ref plutôt qu'un state : lu dans le timeout ci-dessous sans avoir besoin
  // de le remettre dans les dépendances de l'effet (qui ne doit se
  // ré-exécuter que sur cookieAnswered, cf. useGoogleAuth pour le même
  // principe).
  const receivedNativePromptRef = useRef(false);

  // La bannière cookies peut être répondue APRÈS le montage de ce composant
  // (cas typique d'un nouveau compte : premier chargement du site, bannière
  // acceptée, puis inscription dans la foulée) — sans ce listener, l'effet
  // ci-dessous ne s'exécuterait qu'une fois, avant la réponse, et resterait
  // bloqué "invisible" pour le reste de la session (cf. Cookie.tsx).
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
    setIsIos(iosDevice);
    if (iosDevice) setIsVisible(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      receivedNativePromptRef.current = true;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Chrome/Android ne déclenche "beforeinstallprompt" que si son
    // heuristique d'engagement interne l'estime satisfait — jamais garanti
    // dès la première visite (cas typique d'un nouveau compte). Sans repli,
    // ce visiteur ne reçoit alors AUCUNE indication qu'il peut installer.
    // Passé ce délai sans évènement natif, on affiche l'instruction manuelle
    // (menu du navigateur), jamais de bouton "Installer" programmatique
    // puisqu'on n'a pas de prompt à déclencher dans ce cas.
    let fallbackTimer: number | undefined;
    if (androidDevice) {
      fallbackTimer = window.setTimeout(() => {
        if (!receivedNativePromptRef.current) {
          setIsAndroidFallback(true);
          setIsVisible(true);
        }
      }, ANDROID_FALLBACK_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [cookieAnswered]);

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
            Installe {brandName} sur ton écran d'accueil pour un accès plus rapide et recevoir
            les notifications : appuie sur <Share size={14} className="install-pwa-prompt__icon" />{" "}
            puis « Sur l'écran d'accueil ».
          </p>
        </>
      ) : isAndroidFallback ? (
        <>
          <p className="install-pwa-prompt__text">
            Installe {brandName} sur ton téléphone pour un accès plus rapide : ouvre le menu{" "}
            <MoreVertical size={14} className="install-pwa-prompt__icon" /> de ton navigateur puis
            « Installer l'application » ou « Ajouter à l'écran d'accueil ».
          </p>
        </>
      ) : (
        <>
          <p className="install-pwa-prompt__text">
            Installe {brandName} sur ton téléphone pour un accès plus rapide et recevoir les
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
