import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { HandMetal, X } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import PasswordInput from "../../PasswordInput/PasswordInput";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useGoogleAuth, useGoogleButton } from "../../../hooks/useGoogleAuth";
import { useFacebookAuth } from "../../../hooks/useFacebookAuth";
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

// Droits Facebook Login pas encore validés par Meta : bouton masqué en
// attendant, sans retirer le flux (useFacebookAuth) pour le réactiver d'un
// coup une fois l'app validée.
const FACEBOOK_LOGIN_ENABLED = false;

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
  const [termsAcceptedGoogle, setTermsAcceptedGoogle] = useState(false);
  const [termsAcceptedFacebook, setTermsAcceptedFacebook] = useState(false);

  function handleSocialAuthSuccess() {
    onClose();
    navigate("/dashboard");
  }

  const googleAuth = useGoogleAuth({ onSuccess: handleSocialAuthSuccess });
  const { buttonRef: googleButtonRef } = useGoogleButton(googleAuth.handleCredential);
  const facebookAuth = useFacebookAuth({ onSuccess: handleSocialAuthSuccess });

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
      setTermsAcceptedGoogle(false);
      setTermsAcceptedFacebook(false);
      googleAuth.reset();
      facebookAuth.reset();
    }
    // googleAuth/facebookAuth sont recréés à chaque render (hooks locaux) :
    // seul isOpen doit déclencher cette remise à zéro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Un compte 66Partners existe déjà avec l'email Google/Facebook : préremplit
  // le formulaire mot de passe classique, déjà affiché juste en dessous.
  useEffect(() => {
    if (googleAuth.state.step === "linkPending") {
      setEmail(googleAuth.state.email);
    } else if (facebookAuth.state.step === "linkPending") {
      setEmail(facebookAuth.state.email);
    }
  }, [googleAuth.state, facebookAuth.state]);

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
        if (googleAuth.state.step === "linkPending") {
          await googleAuth.linkAfterPasswordLogin();
        } else if (facebookAuth.state.step === "linkPending") {
          await facebookAuth.linkAfterPasswordLogin();
        }
        onClose();
        navigate("/dashboard");
      } else {
        setError("Impossible de récupérer le profil. Réessaie plus tard.");
      }
    } catch {
      setError("Email ou mot de passe incorrect.");
      // Si échec de connexion (mot de passe erroné ou compte inexistant),
      // basculer vers la modale d'inscription au lieu de la page — sauf si
      // on est justement en train d'associer Google/Facebook à un compte
      // qui, lui, existe déjà : rester ici pour laisser réessayer le mot de passe.
      if (googleAuth.state.step !== "linkPending" && facebookAuth.state.step !== "linkPending") {
        onSwitchToRegister();
      }
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
        {googleAuth.state.step === "newAccount" ? (
          <div className="container-modaleConnexion">
            <h3 className="container-modaleConnexion__h3">Finalise ton inscription</h3>
            <h4 className="container-modaleConnexion__h4">
              Connecté·e avec {googleAuth.state.email} <HandMetal size={12} color="#F4B400" />
            </h4>

            <section className="container-modaleConnexion__section">
              <label htmlFor="google-terms" className="container-modaleConnexion__checkboxLabel">
                <input
                  id="google-terms"
                  type="checkbox"
                  checked={termsAcceptedGoogle}
                  onChange={(event) => setTermsAcceptedGoogle(event.target.checked)}
                  className="container-modaleConnexion__checkbox"
                />
                J'ai lu et j'accepte les{" "}
                <NavLink to="/mentionslegales" onClick={onClose}>
                  Mentions Légales
                </NavLink>{" "}
                et la{" "}
                <NavLink to="/confidentialite" onClick={onClose}>
                  Politique de confidentialité
                </NavLink>{" "}
                de 66Partners.
              </label>

              {googleAuth.error && (
                <p className="container-modaleConnexion__error">{googleAuth.error}</p>
              )}

              <button
                type="button"
                className="container-modaleConnexion__submit"
                disabled={googleAuth.isSubmitting}
                onClick={() => googleAuth.completeSignup(termsAcceptedGoogle)}
              >
                {googleAuth.isSubmitting ? "Création..." : "Créer mon compte"}
              </button>
              <p className="container-modaleConnexion__register">
                <button
                  type="button"
                  className="container-modaleConnexion__switch"
                  onClick={() => googleAuth.reset()}
                >
                  Annuler
                </button>
              </p>
            </section>
          </div>
        ) : facebookAuth.state.step === "newAccount" ? (
          <div className="container-modaleConnexion">
            <h3 className="container-modaleConnexion__h3">Finalise ton inscription</h3>
            <h4 className="container-modaleConnexion__h4">
              Connecté·e avec {facebookAuth.state.email} <HandMetal size={12} color="#F4B400" />
            </h4>

            <section className="container-modaleConnexion__section">
              <label htmlFor="facebook-terms" className="container-modaleConnexion__checkboxLabel">
                <input
                  id="facebook-terms"
                  type="checkbox"
                  checked={termsAcceptedFacebook}
                  onChange={(event) => setTermsAcceptedFacebook(event.target.checked)}
                  className="container-modaleConnexion__checkbox"
                />
                J'ai lu et j'accepte les{" "}
                <NavLink to="/mentionslegales" onClick={onClose}>
                  Mentions Légales
                </NavLink>{" "}
                et la{" "}
                <NavLink to="/confidentialite" onClick={onClose}>
                  Politique de confidentialité
                </NavLink>{" "}
                de 66Partners.
              </label>

              {facebookAuth.error && (
                <p className="container-modaleConnexion__error">{facebookAuth.error}</p>
              )}

              <button
                type="button"
                className="container-modaleConnexion__submit"
                disabled={facebookAuth.isSubmitting}
                onClick={() => facebookAuth.completeSignup(termsAcceptedFacebook)}
              >
                {facebookAuth.isSubmitting ? "Création..." : "Créer mon compte"}
              </button>
              <p className="container-modaleConnexion__register">
                <button
                  type="button"
                  className="container-modaleConnexion__switch"
                  onClick={() => facebookAuth.reset()}
                >
                  Annuler
                </button>
              </p>
            </section>
          </div>
        ) : (
          <div className="container-modaleConnexion">
            <h3 className="container-modaleConnexion__h3">Se connecter</h3>
            <h4 className="container-modaleConnexion__h4">
              Bienvenue chez 66Partners <HandMetal size={12} color="#F4B400" />
            </h4>

            <section className="container-modaleConnexion__section">
              {googleAuth.state.step === "linkPending" && (
                <p className="container-modaleConnexion__info">
                  Un compte existe déjà avec {googleAuth.state.email}. Connecte-toi avec ton mot
                  de passe pour associer Google.
                </p>
              )}
              {FACEBOOK_LOGIN_ENABLED && facebookAuth.state.step === "linkPending" && (
                <p className="container-modaleConnexion__info">
                  Un compte existe déjà avec {facebookAuth.state.email}. Connecte-toi avec ton mot
                  de passe pour associer Facebook.
                </p>
              )}

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
                <PasswordInput
                  id="password"
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
                <span className="container-modaleConnexion__googleSlot" ref={googleButtonRef} />
                {FACEBOOK_LOGIN_ENABLED && (
                  <button
                    type="button"
                    className="container-modaleConnexion__socialBtn"
                    onClick={() => facebookAuth.handleLogin()}
                    disabled={facebookAuth.isSubmitting}
                  >
                    <FaFacebook size={18} color="#1877F2" />
                    {facebookAuth.isSubmitting ? "Connexion..." : "Facebook"}
                  </button>
                )}
              </div>

              {googleAuth.error && googleAuth.state.step === "idle" && (
                <p className="container-modaleConnexion__error">{googleAuth.error}</p>
              )}
              {FACEBOOK_LOGIN_ENABLED && facebookAuth.error && facebookAuth.state.step === "idle" && (
                <p className="container-modaleConnexion__error">{facebookAuth.error}</p>
              )}

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
        )}
      </div>
    </div>,
    document.body,
  );
}
