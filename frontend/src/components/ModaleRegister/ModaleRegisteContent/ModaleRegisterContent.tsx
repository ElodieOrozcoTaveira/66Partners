import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { Check, X } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { isAxiosError } from "axios";
import PasswordInput from "../../PasswordInput/PasswordInput";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useGoogleAuth, useGoogleButton } from "../../../hooks/useGoogleAuth";
import { useFacebookAuth } from "../../../hooks/useFacebookAuth";
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

// Droits Facebook Login pas encore validés par Meta : bouton masqué en
// attendant, sans retirer le flux (useFacebookAuth) pour le réactiver d'un
// coup une fois l'app validée.
const FACEBOOK_LOGIN_ENABLED = false;

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [termsAcceptedGoogle, setTermsAcceptedGoogle] = useState(false);
  const [termsAcceptedFacebook, setTermsAcceptedFacebook] = useState(false);

  function handleSocialAuthSuccess() {
    onClose();
    setShowWelcome(true);
  }

  const googleAuth = useGoogleAuth({ onSuccess: handleSocialAuthSuccess });
  const { buttonRef: googleButtonRef } = useGoogleButton(googleAuth.handleCredential);
  const facebookAuth = useFacebookAuth({ onSuccess: handleSocialAuthSuccess });

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
      setTermsAccepted(false);
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

    if (!termsAccepted) {
      setError(
        "Tu dois accepter les Mentions Légales et la Politique de confidentialité pour créer un compte."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<RegisterResponse>("/api/auth/register", {
        pseudo,
        email,
        password,
        termsAccepted,
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
        {googleAuth.state.step === "newAccount" ? (
          <div className="container-modaleRegister">
            <h3 className="container-modaleRegister__h3">Finalise ton inscription</h3>
            <h4 className="container-modaleRegister__h4">
              Connecté·e avec {googleAuth.state.email}
            </h4>

            <section className="container-modaleRegister__section">
              <label htmlFor="google-terms" className="container-modaleRegister__checkboxLabel">
                <input
                  id="google-terms"
                  type="checkbox"
                  checked={termsAcceptedGoogle}
                  onChange={(event) => setTermsAcceptedGoogle(event.target.checked)}
                  className="container-modaleRegister__checkbox"
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
                <p className="container-modaleRegister__error">{googleAuth.error}</p>
              )}

              <button
                type="button"
                className="container-modaleRegister__submit"
                disabled={googleAuth.isSubmitting}
                onClick={() => googleAuth.completeSignup(termsAcceptedGoogle)}
              >
                {googleAuth.isSubmitting ? "Création..." : "Créer mon compte"}
              </button>
              <p className="container-modaleRegister__register">
                <button
                  type="button"
                  className="container-modaleRegister__switch"
                  onClick={() => googleAuth.reset()}
                >
                  Annuler
                </button>
              </p>
            </section>
          </div>
        ) : googleAuth.state.step === "linkPending" ? (
          <div className="container-modaleRegister">
            <h3 className="container-modaleRegister__h3">Compte déjà existant</h3>

            <section className="container-modaleRegister__section">
              <p className="container-modaleRegister__info">
                Un compte 66Partners existe déjà avec {googleAuth.state.email}. Connecte-toi avec
                ton mot de passe pour associer Google à ce compte.
              </p>

              <button
                type="button"
                className="container-modaleRegister__submit"
                onClick={() => {
                  googleAuth.reset();
                  onSwitchToLogin();
                }}
              >
                Se connecter
              </button>
            </section>
          </div>
        ) : facebookAuth.state.step === "newAccount" ? (
          <div className="container-modaleRegister">
            <h3 className="container-modaleRegister__h3">Finalise ton inscription</h3>
            <h4 className="container-modaleRegister__h4">
              Connecté·e avec {facebookAuth.state.email}
            </h4>

            <section className="container-modaleRegister__section">
              <label htmlFor="facebook-terms" className="container-modaleRegister__checkboxLabel">
                <input
                  id="facebook-terms"
                  type="checkbox"
                  checked={termsAcceptedFacebook}
                  onChange={(event) => setTermsAcceptedFacebook(event.target.checked)}
                  className="container-modaleRegister__checkbox"
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
                <p className="container-modaleRegister__error">{facebookAuth.error}</p>
              )}

              <button
                type="button"
                className="container-modaleRegister__submit"
                disabled={facebookAuth.isSubmitting}
                onClick={() => facebookAuth.completeSignup(termsAcceptedFacebook)}
              >
                {facebookAuth.isSubmitting ? "Création..." : "Créer mon compte"}
              </button>
              <p className="container-modaleRegister__register">
                <button
                  type="button"
                  className="container-modaleRegister__switch"
                  onClick={() => facebookAuth.reset()}
                >
                  Annuler
                </button>
              </p>
            </section>
          </div>
        ) : facebookAuth.state.step === "linkPending" ? (
          <div className="container-modaleRegister">
            <h3 className="container-modaleRegister__h3">Compte déjà existant</h3>

            <section className="container-modaleRegister__section">
              <p className="container-modaleRegister__info">
                Un compte 66Partners existe déjà avec {facebookAuth.state.email}. Connecte-toi
                avec ton mot de passe pour associer Facebook à ce compte.
              </p>

              <button
                type="button"
                className="container-modaleRegister__submit"
                onClick={() => {
                  facebookAuth.reset();
                  onSwitchToLogin();
                }}
              >
                Se connecter
              </button>
            </section>
          </div>
        ) : (
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
                <PasswordInput
                  id="password"
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
                <PasswordInput
                  id="confirmPassword"
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

                <label
                  htmlFor="termsAccepted"
                  className="container-modaleRegister__checkboxLabel"
                >
                  <input
                    id="termsAccepted"
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    className="container-modaleRegister__checkbox"
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

                {error && (
                  <p className="container-modaleRegister__error">{error}</p>
                )}

                <button
                  type="submit"
                  className="container-modaleRegister__submit"
                  disabled={isSubmitting || !termsAccepted}
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
                <span className="container-modaleRegister__googleSlot" ref={googleButtonRef} />
                {FACEBOOK_LOGIN_ENABLED && (
                  <button
                    type="button"
                    className="container-modaleRegister__socialBtn"
                    onClick={() => facebookAuth.handleLogin()}
                    disabled={facebookAuth.isSubmitting}
                  >
                    <FaFacebook size={18} color="#1877F2" />
                    {facebookAuth.isSubmitting ? "Connexion..." : "Facebook"}
                  </button>
                )}
              </div>

              {googleAuth.error && (
                <p className="container-modaleRegister__error">{googleAuth.error}</p>
              )}
              {FACEBOOK_LOGIN_ENABLED && facebookAuth.error && (
                <p className="container-modaleRegister__error">{facebookAuth.error}</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
