import { useEffect } from "react";
import { getCookieConsentValue } from "react-cookie-consent";
import { COOKIE_CONSENT_NAME } from "../../lib/cookieConsent";

const GA_MEASUREMENT_ID = "G-RRVLDRNXZ6";

/**
 * Charge réellement le script Google Analytics et déclenche sa
 * configuration. Prévu pour n'être appelé qu'après consentement explicite
 * (soit déjà donné lors d'une visite précédente, soit accepté à l'instant
 * via la bannière — cf. Cookie.tsx) : ne jamais l'appeler par défaut.
 * Idempotent (le garde `#google-analytics` évite un double chargement).
 */
export function loadGoogleAnalytics(): void {
  if (document.getElementById("google-analytics")) return;

  const gtagScript = document.createElement("script");
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gtagScript);

  const inlineScript = document.createElement("script");
  inlineScript.id = "google-analytics";
  inlineScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `;
  document.head.appendChild(inlineScript);
}

/**
 * Ne charge Google Analytics QUE si l'utilisateur a déjà explicitement
 * accepté les cookies lors d'une visite précédente (cookie
 * `66partners-cookie-consent` = "true", posé par la bannière react-cookie-
 * consent). Ni refus ni absence de choix ne déclenchent quoi que ce soit —
 * cf. P0-2 de l'audit RGPD.
 */
export default function GoogleAnalytics() {
  useEffect(() => {
    if (getCookieConsentValue(COOKIE_CONSENT_NAME) === "true") {
      loadGoogleAnalytics();
    }
  }, []);

  return null;
}
