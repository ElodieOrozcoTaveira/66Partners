import { useCallback, useRef, useState } from "react";
import { isAxiosError } from "axios";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Chargé une seule fois pour toute l'app, quel que soit le nombre de
// modales qui utilisent le bouton Google (Connexion + Inscription).
let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger Google Identity Services"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

/**
 * Charge Google Identity Services et expose un déclencheur pour un bouton
 * "Continuer avec Google" personnalisé (même style que le bouton Facebook,
 * cf. demande explicite — le widget officiel de Google est rendu dans un
 * iframe et ne peut être ni restylé ni déclenché par un clic JS externe).
 *
 * `prompt()` affiche l'UI Google (One Tap / sélection de compte) et déclenche
 * le même `callback` que celui configuré par `initialize()` — c'est
 * toujours le vrai flux d'identification Google, jamais une redirection
 * gérée par 66Partners, et le backend (vérification de l'ID token) reste
 * strictement inchangé.
 */
export function useGoogleButton(onCredential: (credential: string) => void) {
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref plutôt que dépendance : évite de recharger/réinitialiser Google
  // Identity Services à chaque re-render du composant appelant.
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const initializedRef = useRef(false);

  const ensureInitialized = useCallback(async (): Promise<boolean> => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setIsUnavailable(true);
      return false;
    }

    try {
      await loadGoogleScript();
    } catch (err) {
      console.error("Google Identity Services indisponible:", err);
      setIsUnavailable(true);
      return false;
    }

    if (!window.google) {
      setIsUnavailable(true);
      return false;
    }

    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredentialRef.current(response.credential),
      });
      initializedRef.current = true;
    }

    return true;
  }, []);

  const triggerLogin = useCallback(async () => {
    setError(null);
    const ready = await ensureInitialized();
    if (!ready || !window.google) return;

    window.google.accounts.id.prompt((notification) => {
      // Prompt non affiché (popups/cookies tiers bloqués, session déjà
      // vue récemment...) : jamais d'échec silencieux sur un clic explicite.
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError(
          "Connexion Google indisponible pour le moment. Vérifie que les cookies tiers ne sont pas bloqués, ou réessaie plus tard.",
        );
      }
    });
  }, [ensureInitialized]);

  return { triggerLogin, isUnavailable, error };
}

interface GoogleAuthApiResponse {
  success: boolean;
  status?: "LOGGED_IN" | "NEW_ACCOUNT" | "EMAIL_ALREADY_REGISTERED";
  token?: string;
  email?: string;
  message?: string;
}

export type GoogleAuthFlowState =
  | { step: "idle" }
  | { step: "newAccount"; credential: string; email: string }
  | { step: "linkPending"; credential: string; email: string };

interface UseGoogleAuthOptions {
  /** Appelé juste après login(token) réussi (avant de fermer la modale). */
  onSuccess: () => void;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  return isAxiosError<{ message?: string }>(err) && err.response?.data?.message
    ? err.response.data.message
    : fallback;
}

/**
 * Orchestration du flux Google côté modale : un seul credential Google peut
 * aboutir à trois issues (connexion directe / nouveau compte à finaliser
 * avec les CGU / email déjà pris à associer après un login classique) — cf.
 * AuthService.loginWithGoogle côté backend, jamais de fusion automatique ici.
 */
export function useGoogleAuth({ onSuccess }: UseGoogleAuthOptions) {
  const { login } = useAuth();
  const [state, setState] = useState<GoogleAuthFlowState>({ step: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredential = useCallback(
    async (credential: string) => {
      setError(null);
      setIsSubmitting(true);
      try {
        const res = await api.post<GoogleAuthApiResponse>("/api/auth/google", { credential });

        if (res.data.status === "LOGGED_IN" && res.data.token) {
          const ok = await login(res.data.token);
          if (ok) {
            setState({ step: "idle" });
            onSuccess();
          } else {
            setError("Impossible de récupérer le profil. Réessaie plus tard.");
          }
        } else if (res.data.status === "NEW_ACCOUNT") {
          setState({ step: "newAccount", credential, email: res.data.email ?? "" });
        } else if (res.data.status === "EMAIL_ALREADY_REGISTERED") {
          setState({ step: "linkPending", credential, email: res.data.email ?? "" });
        }
      } catch (err) {
        setError(extractErrorMessage(err, "Connexion avec Google impossible. Réessaie plus tard."));
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, onSuccess],
  );

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
        const res = await api.post<GoogleAuthApiResponse>("/api/auth/google/complete", {
          credential: state.credential,
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
        setError(extractErrorMessage(err, "Impossible de créer le compte avec Google."));
      } finally {
        setIsSubmitting(false);
      }
    },
    [state, login, onSuccess],
  );

  /**
   * À appeler juste après un login mot de passe réussi si state.step est
   * "linkPending" — associe le compte Google déjà vérifié au compte qui
   * vient de s'authentifier. Best-effort et silencieux : le login classique
   * est déjà réussi, une association qui échoue ne doit pas bloquer l'accès.
   */
  const linkAfterPasswordLogin = useCallback(async () => {
    if (state.step !== "linkPending") return;
    try {
      await api.post("/api/auth/google/link", { credential: state.credential });
    } catch (err) {
      console.error("Association du compte Google impossible:", err);
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
    handleCredential,
    completeSignup,
    linkAfterPasswordLogin,
    reset,
  };
}
