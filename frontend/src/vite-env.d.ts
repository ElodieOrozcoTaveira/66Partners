/// <reference types="vite/client" />

declare module "*.scss";
declare module "*.css";

interface Window {
  gtag?: (...args: unknown[]) => void;
  // Injecté par le script Google Identity Services (accounts.google.com/gsi/client)
  // — chargé dynamiquement, cf. hooks/useGoogleAuth.ts. Bouton "Continuer
  // avec Google" personnalisé (identique à celui de Facebook) qui déclenche
  // le flux via prompt() plutôt que le widget officiel rendu par Google
  // (rendu en iframe, impossible à restyler). Surface minimale utilisée par
  // l'app, pas une reprise complète des types Google.
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        prompt: (
          notificationCallback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
          }) => void
        ) => void;
      };
    };
  };
  // Injecté par le SDK JavaScript Facebook (connect.facebook.net/.../sdk.js)
  // — chargé dynamiquement, cf. hooks/useFacebookAuth.ts. Surface minimale
  // utilisée par l'app (FB.init + FB.login), pas une reprise complète des
  // types du SDK Facebook.
  fbAsyncInit?: () => void;
  FB?: {
    init: (config: {
      appId: string;
      version: string;
      cookie?: boolean;
      xfbml?: boolean;
    }) => void;
    login: (
      callback: (response: {
        authResponse?: { accessToken: string; userID: string } | null;
        status?: string;
      }) => void,
      options?: { scope?: string }
    ) => void;
  };
}
