import { useCallback, useState } from "react";
import { isAxiosError } from "axios";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";

const FACEBOOK_SDK_SRC = "https://connect.facebook.net/fr_FR/sdk.js";
const FACEBOOK_SDK_VERSION = "v21.0";

// Chargé une seule fois pour toute l'app, quel que soit le nombre de
// modales qui utilisent le bouton Facebook (Connexion + Inscription) — même
// principe que le script Google Identity Services (cf. useGoogleAuth.ts).
let facebookSdkPromise: Promise<void> | null = null;

function loadFacebookSdk(appId: string): Promise<void> {
  if (facebookSdkPromise) return facebookSdkPromise;

  facebookSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, version: FACEBOOK_SDK_VERSION, cookie: true, xfbml: false });
      resolve();
    };

    if (document.querySelector(`script[src="${FACEBOOK_SDK_SRC}"]`)) {
      // Script déjà présent (StrictMode / remontage) : FB.init a déjà été
      // programmé par fbAsyncInit ci-dessus lors du premier chargement.
      if (window.FB) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = FACEBOOK_SDK_SRC;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Impossible de charger le SDK Facebook"));
    document.body.appendChild(script);
  });

  return facebookSdkPromise;
}

interface SocialAuthApiResponse {
  success: boolean;
  status?: "LOGGED_IN" | "NEW_ACCOUNT" | "EMAIL_ALREADY_REGISTERED";
  token?: string;
  email?: string;
  message?: string;
}

export type FacebookAuthFlowState =
  | { step: "idle" }
  | { step: "newAccount"; accessToken: string; email: string }
  | { step: "linkPending"; accessToken: string; email: string };

interface UseFacebookAuthOptions {
  /** Appelé juste après login(token) réussi (avant de fermer la modale). */
  onSuccess: () => void;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  return isAxiosError<{ message?: string }>(err) && err.response?.data?.message
    ? err.response.data.message
    : fallback;
}

/**
 * Orchestration du flux Facebook côté modale — même machine à états que
 * useGoogleAuth (idle / newAccount / linkPending), cf.
 * AuthService.loginWithFacebook côté backend, jamais de fusion automatique.
 * Contrairement au bouton Google (widget officiel auto-déclenché), le
 * bouton Facebook existant dans la modale déclenche lui-même FB.login().
 */
export function useFacebookAuth({ onSuccess }: UseFacebookAuthOptions) {
  const { login } = useAuth();
  const [state, setState] = useState<FacebookAuthFlowState>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = useCallback(async () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;
    if (!appId) {
      setError("Connexion Facebook indisponible pour le moment.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await loadFacebookSdk(appId);

      const fbResponse = await new Promise<{ accessToken: string }>((resolve, reject) => {
        window.FB!.login(
          (response) => {
            if (response.authResponse) resolve(response.authResponse);
            else reject(new Error("Connexion Facebook annulée."));
          },
          { scope: "public_profile,email" }
        );
      });

      const res = await api.post<SocialAuthApiResponse>("/api/auth/facebook", {
        accessToken: fbResponse.accessToken,
      });

      if (res.data.status === "LOGGED_IN" && res.data.token) {
        const ok = await login(res.data.token);
        if (ok) {
          setState({ step: "idle" });
          onSuccess();
        } else {
          setError("Impossible de récupérer le profil. Réessaie plus tard.");
        }
      } else if (res.data.status === "NEW_ACCOUNT") {
        setState({ step: "newAccount", accessToken: fbResponse.accessToken, email: res.data.email ?? "" });
      } else if (res.data.status === "EMAIL_ALREADY_REGISTERED") {
        setState({ step: "linkPending", accessToken: fbResponse.accessToken, email: res.data.email ?? "" });
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Connexion avec Facebook impossible. Réessaie plus tard."));
    } finally {
      setIsSubmitting(false);
    }
  }, [login, onSuccess]);

  const completeSignup = useCallback(
    async (termsAccepted: boolean) => {
      if (state.step !== "newAccount") return;
      if (!termsAccepted) {
        setError(
          "Tu dois accepter les Mentions Légales et la Politique de confidentialité pour créer un compte.",
        );
        return;
      }
      setError(null);
      setIsSubmitting(true);
      try {
        const res = await api.post<SocialAuthApiResponse>("/api/auth/facebook/complete", {
          accessToken: state.accessToken,
          termsAccepted: true,
        });
        const ok = await login(res.data.token!);
        if (ok) {
          setState({ step: "idle" });
          onSuccess();
        } else {
          setError("Impossible de récupérer le profil après inscription.");
        }
      } catch (err) {
        setError(extractErrorMessage(err, "Impossible de créer le compte avec Facebook."));
      } finally {
        setIsSubmitting(false);
      }
    },
    [state, login, onSuccess],
  );

  /**
   * À appeler juste après un login mot de passe réussi si state.step est
   * "linkPending" — associe le compte Facebook déjà vérifié au compte qui
   * vient de s'authentifier. Best-effort et silencieux, comme pour Google.
   */
  const linkAfterPasswordLogin = useCallback(async () => {
    if (state.step !== "linkPending") return;
    try {
      await api.post("/api/auth/facebook/link", { accessToken: state.accessToken });
    } catch (err) {
      console.error("Association du compte Facebook impossible:", err);
    } finally {
      setState({ step: "idle" });
    }
  }, [state]);

  const reset = useCallback(() => {
    setState({ step: "idle" });
    setError(null);
  }, []);

  return {
    state,
    error,
    isSubmitting,
    handleLogin,
    completeSignup,
    linkAfterPasswordLogin,
    reset,
  };
}
