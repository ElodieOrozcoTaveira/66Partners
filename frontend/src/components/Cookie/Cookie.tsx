// app/components/CookieConsent.tsx
'use client';

import CookieConsent from "react-cookie-consent";
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
      onAccept={handleAccept}
      onDecline={handleDecline}
      containerClasses="cookie-banner"
      cookieName={COOKIE_CONSENT_NAME}
      style={{
        padding: "20px",
        alignItems: "center",
        zIndex: 2000
      }}
      buttonStyle={{ 
        background: "#fff",
        color: "#ff4500",
        fontSize: "14px",
        padding: "10px 30px",
        borderRadius: "5px",
        fontWeight: "600"
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#fff",
        border: "2px solid #fff",
        fontSize: "14px",
        padding: "10px 30px",
        borderRadius: "5px",
        fontWeight:'bold',
      }}
      expires={365}
    >
      🍪 Ce site utilise des cookies pour améliorer votre expérience et analyser le trafic 🍪{" "}
    </CookieConsent>
  );
}