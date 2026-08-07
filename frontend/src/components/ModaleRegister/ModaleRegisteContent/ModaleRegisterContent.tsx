import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { Check, X } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { isAxiosError } from "axios";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import ModaleBienvenue from "../../ModaleBienvenue/ModaleBienvenue";
import "./ModaleRegisterContent.scss";

interface ModaleContentProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
}

export default function ModaleRegisterContent({
  isOpen,
  onClose,
  onSwitchToLogin,
}: ModaleContentProps) {
  const { login } = useAuth();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

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
      setPseudo("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (showWelcome) {
    return (
      <ModaleBienvenue
        isOpen={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          onClose();
        }}
      />
    );
  }

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<RegisterResponse>("/api/auth/register", {
        pseudo,
        email,
        password,
      });
      console.debug("ModaleRegister: register response", res.data);
      const ok = await login(res.data.token);
      if (ok) {
        onClose();
        setShowWelcome(true);
      } else {
        setError("Impossible de récupérer le profil après inscription.");
      }
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de créer le compte. Vérifiez vos informations.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="modale-register-overlay" onClick={onClose}>
      <div
        className="modale-register-content"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modale-register-content__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <div className="container-modaleRegister">
          <h3 className="container-modaleRegister__h3">Créer un compte</h3>
          <h4 className="container-modaleRegister__h4">
            Rejoignez la communauté 66Partners et vivez l'aventure avec nous !
          </h4>

          <section className="container-modaleRegister__section">
            <form
              id="register-form"
              className="container-modaleRegister__form"
              onSubmit={handleSubmit}
            >
              <label
                htmlFor="pseudo"
                className="container-modaleRegister__label"
              >
                Pseudo
              </label>
              <input
                id="pseudo"
                type="text"
                required
                value={pseudo}
                onChange={(event) => setPseudo(event.target.value)}
                className="container-modaleRegister__input"
              />

              <label
                htmlFor="email"
                className="container-modaleRegister__label"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="container-modaleRegister__input"
              />

              <label
                htmlFor="password"
                className="container-modaleRegister__label"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="container-modaleRegister__input"
              />

              <label
                htmlFor="confirmPassword"
                className="container-modaleRegister__label"
              >
                Confirmation du mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={`container-modaleRegister__input${passwordsMismatch ? " container-modaleRegister__input--error" : ""}`}
              />
              {passwordsMismatch && (
                <p className="container-modaleRegister__passwordHint container-modaleRegister__passwordHint--error">
                  <X size={12} /> Les mots de passe ne correspondent pas
                </p>
              )}
              {passwordsMatch && (
                <p className="container-modaleRegister__passwordHint container-modaleRegister__passwordHint--ok">
                  <Check size={12} /> Les mots de passe correspondent
                </p>
              )}

              {error && (
                <p className="container-modaleRegister__error">{error}</p>
              )}

              <button
                type="submit"
                className="container-modaleRegister__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Création..." : "Créer mon compte"}
              </button>
            </form>

            <p className="container-modaleRegister__register">
              Déjà un compte ?{" "}
              <button
                type="button"
                className="container-modaleRegister__switch"
                onClick={onSwitchToLogin}
              >
                Se connecter
              </button>
            </p>

            <div className="container-modaleRegister__divider">
              <span>ou continuer avec</span>
            </div>

            <div className="container-modaleRegister__social">
              <button
                type="button"
                className="container-modaleRegister__socialBtn"
              >
                <FcGoogle size={18} /> Google
              </button>
              <button
                type="button"
                className="container-modaleRegister__socialBtn"
              >
                <FaFacebook size={18} color="#1877F2" /> Facebook
              </button>
            </div>

            <p className="container-modaleRegister__terms">
              En créant un compte, vous acceptez nos{" "}
              <NavLink to="/mentionslegales" onClick={onClose}>
                Mentions Légales
              </NavLink>{" "}
              et notre{" "}
              <NavLink to="/confidentialite" onClick={onClose}>
                Politique de confidentialité
              </NavLink>
              .
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
