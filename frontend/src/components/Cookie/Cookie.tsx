// app/components/CookieConsent.tsx
'use client';

import CookieConsent from "react-cookie-consent"; 
import './Cookie.scss';

export default function CookieBanner() {
  const handleAccept = () => {
    // Activez Google Analytics seulement après acceptation
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  };

  const handleDecline = () => {
    // Désactivez Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }
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
      cookieName="66partners-cookie-consent"
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