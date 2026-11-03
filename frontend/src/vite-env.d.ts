/// <reference types="vite/client" />

declare module "*.scss";
declare module "*.css";

interface Window {
  gtag?: (...args: unknown[]) => void;
  // Injecté par le script Google Identity Services (accounts.google.com/gsi/client)
  // — chargé dynamiquement, cf. hooks/useGoogleAuth.ts. Widget officiel
  // Google (bouton "Continuer avec Google" rendu par Google lui-même, cf.
  // renderButton) — compatible Safari/iOS, contrairement à prompt()/One Tap
  // qui dépend des cookies tiers ou de FedCM (non supporté par Safari).
  // Surface minimale utilisée par l'app, pas une reprise complète des types
  // Google.
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            type?: "standard" | "icon";
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            shape?: "rectangular" | "pill" | "circle" | "square";
            width?: number;
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          }
        ) => void;
      };
    };
  };
}
