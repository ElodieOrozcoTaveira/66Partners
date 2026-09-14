import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MailCheck } from "lucide-react";
import { requestAdminPasswordReset } from "../../lib/adminAccess";
import "../AdminLogin/AdminLogin.scss";

/**
 * Un seul admin, pas de compte/email associé (cf. adminAccess.ts) : pas de
 * champ à saisir, le lien part toujours vers l'adresse fixe configurée côté
 * serveur (ADMIN_RECOVERY_EMAIL).
 */
export default function AdminMotDePasseOublie() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);
    const result = await requestAdminPasswordReset();
    setIsSubmitting(false);

    if (result.success) {
      setIsSent(true);
    } else {
      setError("Impossible d'envoyer l'email pour le moment. Réessaie plus tard.");
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-page__card">
        <img src="/logo3.webp" alt="logo 66partners" className="admin-login-page__logo" />

        {isSent ? (
          <>
            <span className="admin-login-page__icon">
              <MailCheck size={22} strokeWidth={2.2} />
            </span>
            <h1>Vérifie la boîte mail</h1>
            <p>Un lien de réinitialisation vient d'être envoyé. Pense à vérifier les spams.</p>
            <Link to="/admin" className="admin-login-page__submit" style={{ textDecoration: "none", display: "block", boxSizing: "border-box" }}>
              Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <span className="admin-login-page__icon">
              <Mail size={22} strokeWidth={2.2} />
            </span>
            <h1>Mot de passe oublié ?</h1>
            <p>On envoie un lien de réinitialisation à l'adresse administrateur configurée.</p>

            {error && <p className="admin-login-page__error">{error}</p>}

            <button
              type="button"
              className="admin-login-page__submit"
              onClick={handleClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Envoi…" : "Envoyer le lien"}
            </button>
            <Link to="/admin" className="admin-login-page__link">
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
