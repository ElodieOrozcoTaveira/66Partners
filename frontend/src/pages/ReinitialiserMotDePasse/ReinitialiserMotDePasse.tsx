import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound, ShieldAlert } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import "./ReinitialiserMotDePasse.scss";

export default function ReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!token) {
    return (
      <div className="reset-mdp">
        <div className="reset-mdp__card">
          <span className="reset-mdp__icon reset-mdp__icon--error">
            <ShieldAlert size={26} />
          </span>
          <h1 className="reset-mdp__title">Lien invalide</h1>
          <p className="reset-mdp__text">
            Ce lien de réinitialisation est incomplet ou n'est plus valable.
          </p>
          <Link to="/mot-de-passe-oublie" className="reset-mdp__submit reset-mdp__submit--link">
            Refaire une demande
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setIsDone(true);
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de réinitialiser le mot de passe pour le moment.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="reset-mdp">
      <div className="reset-mdp__card">
        {isDone ? (
          <>
            <span className="reset-mdp__icon reset-mdp__icon--success">
              <CheckCircle2 size={26} />
            </span>
            <h1 className="reset-mdp__title">Mot de passe mis à jour !</h1>
            <p className="reset-mdp__text">
              Ton mot de passe a bien été changé. Tu peux maintenant te connecter avec
              tes nouveaux identifiants.
            </p>
            <button
              type="button"
              className="reset-mdp__submit"
              onClick={() => navigate("/")}
            >
              Retour à l'accueil
            </button>
          </>
        ) : (
          <>
            <span className="reset-mdp__icon">
              <KeyRound size={22} />
            </span>
            <h1 className="reset-mdp__title">Choisis un nouveau mot de passe</h1>
            <p className="reset-mdp__text">
              Il doit contenir au moins 8 caractères.
            </p>

            <form className="reset-mdp__form" onSubmit={handleSubmit}>
              <label htmlFor="new-password" className="reset-mdp__label">
                Nouveau mot de passe
              </label>
              <PasswordInput
                id="new-password"
                required
                autoFocus
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="reset-mdp__input"
              />

              <label htmlFor="confirm-password" className="reset-mdp__label">
                Confirmer le mot de passe
              </label>
              <PasswordInput
                id="confirm-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="reset-mdp__input"
              />

              {error && <p className="reset-mdp__error">{error}</p>}

              <button
                type="submit"
                className="reset-mdp__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Mise à jour..." : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
