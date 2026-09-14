import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound, ShieldAlert } from "lucide-react";
import { resetAdminPassword } from "../../lib/adminAccess";
import PasswordInput from "../../components/PasswordInput/PasswordInput";
import "../AdminLogin/AdminLogin.scss";

export default function AdminReinitialiserMotDePasse() {
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
      <div className="admin-login-page">
        <div className="admin-login-page__card">
          <span className="admin-login-page__icon">
            <ShieldAlert size={22} strokeWidth={2.2} />
          </span>
          <h1>Lien invalide</h1>
          <p>Ce lien de réinitialisation est incomplet ou n'est plus valable.</p>
          <Link to="/admin/mot-de-passe-oublie" className="admin-login-page__link">
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
    const result = await resetAdminPassword(token as string, password);
    setIsSubmitting(false);

    if (result.success) {
      setIsDone(true);
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-page__card">
        {isDone ? (
          <>
            <span className="admin-login-page__icon">
              <CheckCircle2 size={22} strokeWidth={2.2} />
            </span>
            <h1>Mot de passe mis à jour !</h1>
            <p>Tu peux maintenant te connecter à l'espace admin avec le nouveau mot de passe.</p>
            <button
              type="button"
              className="admin-login-page__submit"
              onClick={() => navigate("/admin")}
            >
              Aller à la connexion
            </button>
          </>
        ) : (
          <>
            <span className="admin-login-page__icon">
              <KeyRound size={22} strokeWidth={2.2} />
            </span>
            <h1>Nouveau mot de passe admin</h1>
            <p>Il doit contenir au moins 8 caractères.</p>

            <form onSubmit={handleSubmit}>
              <PasswordInput
                wrapperClassName="admin-login-page__field"
                required
                autoFocus
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
              />

              <PasswordInput
                wrapperClassName="admin-login-page__field"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
              />

              {error && <p className="admin-login-page__error">{error}</p>}

              <button type="submit" className="admin-login-page__submit" disabled={isSubmitting}>
                {isSubmitting ? "Mise à jour…" : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
