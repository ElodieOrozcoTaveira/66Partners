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
 * Charge Google Identity Services et affiche le bouton officiel Google dans
 * l'élément référencé par le ref renvoyé. Ne simule jamais un faux bouton —
 * c'est le widget rendu par Google lui-même (popup gérée par Google, pas de
 * redirection depuis 66Partners).
 *
 * Widget officiel plutôt qu'un bouton personnalisé + prompt()/One Tap :
 * One Tap dépend des cookies tiers (ou de FedCM, non supporté par Safari)
 * pour savoir si une session Google est active — indisponible sur Safari
 * (iPhone comme Mac, PWA ou onglet classique, ITP bloque les cookies tiers
 * depuis Safari 13.1). Le bouton officiel déclenche un vrai flux OAuth popup
 * où l'utilisateur s'authentifie directement chez Google, sans dépendre de
 * cette lecture de session — compatible Safari. Backend inchangé : même
 * credential (ID token), même callback, même vérification.
 *
 * Ref-callback plutôt qu'un `useRef` + effet à dépendances vides : la modale
 * (ModaleContent) reste montée en permanence et bascule juste entre `null`
 * et son contenu selon `isOpen`, donc le <span> porteur du bouton est
 * démonté/remonté à chaque ouverture — un effet à dépendances vides ne se
 * ré-exécuterait qu'une fois, potentiellement avant que le <span> n'existe
 * (bouton alors silencieusement jamais rendu). Le ref-callback, lui, est
 * rappelé par React à chaque montage du nœud, donc à chaque ouverture.
 */
export function useGoogleButton(onCredential: (credential: string) => void) {
  const [isUnavailable, setIsUnavailable] = useState(false);
  // Ref plutôt que dépendance : évite de recharger/réinitialiser le bouton
  // Google à chaque re-render du composant appelant.
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const initializedRef = useRef(false);

  const buttonRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return; // le <span> vient d'être démonté (modale fermée) : rien à faire

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setIsUnavailable(true);
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (!window.google) return;
        if (!initializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => onCredentialRef.current(response.credential),
          });
          initializedRef.current = true;
        }
        window.google.accounts.id.renderButton(node, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 240,
        });
      })
      .catch((err) => {
        console.error("Google Identity Services indisponible:", err);
        setIsUnavailable(true);
      });
  }, []);

  return { buttonRef, isUnavailable };
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
