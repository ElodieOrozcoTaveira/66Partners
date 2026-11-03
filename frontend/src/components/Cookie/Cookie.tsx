// app/components/CookieConsent.tsx
'use client';

import CookieConsent from "react-cookie-consent";
import { NavLink } from "react-router-dom";
import { Cookie } from "lucide-react";
import { loadGoogleAnalytics } from "../Analytics/Analytics";
import { COOKIE_CONSENT_NAME } from "../../lib/cookieConsent";
import './Cookie.scss';

export default function CookieBanner() {
  const handleAccept = () => {
    // Premier chargement réel du script GA, seulement maintenant que le
    // consentement vient d'être donné explicitement (cf. P0-2).
    loadGoogleAnalytics();

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
    // InstallPwaPrompt attend ce choix avant de s'afficher (RGPD : pas de
    // bandeau superposé) — sans cet évènement, un compte qui répond à la
    // bannière puis s'inscrit dans la foulée ne verrait jamais la
    // proposition d'installation (son check au montage a déjà eu lieu).
    window.dispatchEvent(new Event('cookie-consent-changed'));
  };

  const handleDecline = () => {
    // Désactivez Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
    window.dispatchEvent(new Event('cookie-consent-changed'));
  };

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accepter"
      declineButtonText="Refuser"
      enableDeclineButton
      flipButtons
      onAccept={handleAccept}
      onDecline={handleDecline}
      cookieName={COOKIE_CONSENT_NAME}
      // Styles inline de la librairie désactivés : carte flottante de la
      // refonte (cf. Cookie.scss).
      disableStyles
      containerClasses="cookie-banner"
      contentClasses="cookie-banner__content"
      buttonWrapperClasses="cookie-banner__actions"
      buttonClasses="cookie-banner__accept"
      declineButtonClasses="cookie-banner__decline"
      expires={365}
    >
      <span className="cookie-banner__icon" aria-hidden="true">
        <Cookie size={20} />
      </span>
      <span className="cookie-banner__text">
        <strong>Tes données, ton choix</strong>
        Nous utilisons des cookies de mesure d'audience pour améliorer le site.{" "}
        <NavLink to="/confidentialite">En savoir plus</NavLink>
      </span>
    </CookieConsent>
  );
}
