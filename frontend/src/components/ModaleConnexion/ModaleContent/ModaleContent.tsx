import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { HandMetal, X } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import "./ModaleContent.scss";

interface ModaleContentProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export default function ModaleContent({
  isOpen,
  onClose,
  onSwitchToRegister,
}: ModaleContentProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      console.debug("ModaleContent: login response", res.data);
      const ok = await login(res.data.token);
      if (ok) {
        onClose();
        navigate("/profile");
      } else {
        setError("Impossible de récupérer le profil. Réessaie plus tard.");
      }
    } catch {
      setError("Email ou mot de passe incorrect.");
      // Si échec de connexion (mot de passe erroné ou compte inexistant),
      // basculer vers la modale d'inscription au lieu de la page.
      onSwitchToRegister();
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="modale-overlay" onClick={onClose}>
      <div
        className="modale-content"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modale-content__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <div className="container-modaleConnexion">
          <h3 className="container-modaleConnexion__h3">Se connecter</h3>
          <h4 className="container-modaleConnexion__h4">
            Bienvenue chez 66Partners <HandMetal size={12} color="#F4B400" />
          </h4>

          <section className="container-modaleConnexion__section">
            <form
              id="login-form"
              className="container-modaleConnexion__form"
              onSubmit={handleSubmit}
            >
              <label
                htmlFor="email"
                className="container-modaleConnexion__label"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="container-modaleConnexion__input"
              />

              <label
                htmlFor="password"
                className="container-modaleConnexion__label"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="container-modaleConnexion__input"
              />

              <NavLink
                to="/mot-de-passe-oublie"
                onClick={onClose}
                className="container-modaleConnexion__forgot"
              >
                Mot de passe oublié ?
              </NavLink>

              {error && (
                <p className="container-modaleConnexion__error">{error}</p>
              )}

              <button
                type="submit"
                className="container-modaleConnexion__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="container-modaleConnexion__divider">
              <span>ou continuer avec</span>
            </div>

            <div className="container-modaleConnexion__social">
              <button
                type="button"
                className="container-modaleConnexion__socialBtn"
              >
                <FcGoogle size={18} /> Google
              </button>
              <button
                type="button"
                className="container-modaleConnexion__socialBtn"
              >
                <FaFacebook size={18} color="#1877F2" /> Facebook
              </button>
            </div>

            <p className="container-modaleConnexion__register">
              Pas encore de compte ?{" "}
              <button
                type="button"
                className="container-modaleConnexion__switch"
                onClick={onSwitchToRegister}
              >
                S'inscrire
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
