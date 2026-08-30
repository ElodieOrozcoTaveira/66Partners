import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import "./MotDePasseOublie.scss";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setIsSent(true);
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible d'envoyer l'email pour le moment. Réessaie plus tard.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mdp-oublie">
      <div className="mdp-oublie__card">
        <Link to="/" className="mdp-oublie__back">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>

        {isSent ? (
          <div className="mdp-oublie__success">
            <span className="mdp-oublie__icon mdp-oublie__icon--success">
              <MailCheck size={26} />
            </span>
            <h1 className="mdp-oublie__title">Vérifie ta boîte mail</h1>
            <p className="mdp-oublie__text">
              Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de
              réinitialisation vient de lui être envoyé. Pense à vérifier tes spams.
            </p>
            <button
              type="button"
              className="mdp-oublie__resend"
              onClick={() => setIsSent(false)}
            >
              Renvoyer à une autre adresse
            </button>
          </div>
        ) : (
          <>
            <span className="mdp-oublie__icon">
              <Mail size={22} />
            </span>
            <h1 className="mdp-oublie__title">Mot de passe oublié ?</h1>
            <p className="mdp-oublie__text">
              Indique ton adresse e-mail, on t'envoie un lien pour choisir un nouveau
              mot de passe.
            </p>

            <form className="mdp-oublie__form" onSubmit={handleSubmit}>
              <label htmlFor="forgot-email" className="mdp-oublie__label">
                Adresse e-mail
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mdp-oublie__input"
                placeholder="toi@exemple.fr"
              />

              {error && <p className="mdp-oublie__error">{error}</p>}

              <button
                type="submit"
                className="mdp-oublie__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
