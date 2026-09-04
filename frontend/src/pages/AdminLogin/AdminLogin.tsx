import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { loginAdmin, type AdminLoginResult } from "../../lib/adminAccess";
import "./AdminLogin.scss";

const ERROR_MESSAGES: Record<Exclude<AdminLoginResult, { success: true }>["reason"], string> = {
  invalid: "Mot de passe incorrect.",
  rate_limited: "Trop de tentatives, réessaie dans quelques minutes.",
  network: "Connexion au serveur impossible, réessaie.",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ||
    "/admin/stats";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await loginAdmin(password);

    if (result.success) {
      navigate(from, { replace: true });
      return;
    }

    setError(ERROR_MESSAGES[result.reason]);
    setSubmitting(false);
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-page__card">
        <img src="/logo3.webp" alt="logo 66partners" className="admin-login-page__logo" />
        <span className="admin-login-page__icon">
          <ShieldCheck size={22} strokeWidth={2.2} />
        </span>
        <h1>Espace Administrateur</h1>
        <p>Saisis le mot de passe administrateur pour accéder au tableau de bord.</p>

        <form onSubmit={handleSubmit}>
          <label className="admin-login-page__field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Mot de passe administrateur"
              autoFocus
            />
            <button
              type="button"
              className="admin-login-page__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
            </button>
          </label>

          {error && <p className="admin-login-page__error">{error}</p>}

          <button type="submit" className="admin-login-page__submit" disabled={submitting}>
            {submitting ? "Vérification…" : "Accéder"}
          </button>
        </form>
      </div>
    </div>
  );
}
