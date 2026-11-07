import { useState } from "react";
import { MailCheck, X } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../lib/toast";
import "./EmailVerifyNotice.scss";

const DISMISS_KEY = "66partners-verify-email-dismissed";

interface EmailVerifyNoticeProps {
  /** "banner" : rappel discret (espace membre) ; "gate" : à la place d'un formulaire. */
  variant?: "banner" | "gate";
}

/** Rappel « Confirme ton adresse email », avec renvoi du lien. */
export default function EmailVerifyNotice({ variant = "banner" }: EmailVerifyNoticeProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return variant === "banner" && sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!user || user.emailVerified !== false || dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      const { data } = await api.post<{ message: string }>("/api/auth/resend-verification");
      toast.success(data.message);
    } catch (err) {
      toast.error(
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible d'envoyer l'email pour le moment.",
      );
    } finally {
      setSending(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Rien à faire.
    }
  }

  return (
    <div className={`email-verify email-verify--${variant}`} role="status">
      <span className="email-verify__icon" aria-hidden="true">
        <MailCheck size={variant === "gate" ? 24 : 18} strokeWidth={2.4} />
      </span>
      <div className="email-verify__body">
        <strong>Confirme ton adresse email</strong>
        <p>
          {variant === "gate"
            ? "Pour organiser une sortie, clique d'abord sur le lien envoyé à "
            : "Clique sur le lien envoyé à "}
          <span className="email-verify__email">{user.email}</span>
          {variant === "gate" ? "." : " pour pouvoir organiser tes sorties."}
        </p>
        <button type="button" className="email-verify__resend" onClick={() => void resend()} disabled={sending}>
          {sending ? "Envoi…" : "Renvoyer le lien"}
        </button>
      </div>
      {variant === "banner" && (
        <button type="button" className="email-verify__close" onClick={dismiss} aria-label="Masquer">
          <X size={16} strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
}
