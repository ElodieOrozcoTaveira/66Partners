import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { HandMetal, X } from "lucide-react";
import BirthDateField from "../../BirthDateField/BirthDateField";
import TerritoryPicker, { useSignupTerritory } from "../../TerritoryPicker/TerritoryPicker";
import PasswordInput from "../../PasswordInput/PasswordInput";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useGoogleAuth, useGoogleButton } from "../../../hooks/useGoogleAuth";
import "./ModaleContent.scss";
import { useBranding } from "../../../contexts/TerritoryContext";

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
  const { brandName, asset } = useBranding();
  const { login, getLastLoginFailureReason } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAcceptedGoogle, setTermsAcceptedGoogle] = useState(false);
  const [birthDateGoogle, setBirthDateGoogle] = useState("");
  const { territoryCode: signupTerritory, setTerritoryCode: setSignupTerritory } = useSignupTerritory();

  function handleSocialAuthSuccess() {
    onClose();
    navigate("/dashboard");
  }

  const googleAuth = useGoogleAuth({ onSuccess: handleSocialAuthSuccess });
  const { buttonRef: googleButtonRef } = useGoogleButton(googleAuth.handleCredential);

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
      setBirthDateGoogle("");
      googleAuth.reset();
    }
    // googleAuth est recréé à chaque render (hooks locaux) :
    // seul isOpen doit déclencher cette remise à zéro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Un compte {brandName} existe déjà avec l'email Google : préremplit
  // le formulaire mot de passe classique, déjà affiché juste en dessous.
  useEffect(() => {
    if (googleAuth.state.step === "linkPending") {
      setEmail(googleAuth.state.email);
    }
  }, [googleAuth.state]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // Seul un échec de CET appel (401, réseau...) constitue un véritable
      // échec d'authentification — tout ce qui suit (login()) ne doit jamais
      // basculer vers l'inscription, cf. rapport § bug inscription→connexion.
      const res = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      if (import.meta.env.DEV) {
        console.debug("ModaleContent: login successful");
      }

      const ok = await login(res.data.token);
      if (ok) {
        if (googleAuth.state.step === "linkPending") {
          await googleAuth.linkAfterPasswordLogin();
        }
        onClose();
        navigate("/dashboard");
      } else if (getLastLoginFailureReason() === "storage") {
        setError(
          "Ton navigateur bloque la mémorisation de la connexion (navigation privée ou extension). Autorise le stockage local pour te connecter.",
        );
      } else {
        setError("Impossible de récupérer le profil. Réessaie plus tard.");
      }
    } catch {
      setError("Email ou mot de passe incorrect.");
      // Si échec de connexion (mot de passe erroné ou compte inexistant),
      // basculer vers la modale d'inscription au lieu de la page — sauf si
      // on est justement en train d'associer Google à un compte
      // qui, lui, existe déjà : rester ici pour laisser réessayer le mot de passe.
      if (googleAuth.state.step !== "linkPending") {
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
            <img className="modal-brand" src={asset("logo")} alt="" />
            <h3 className="container-modaleConnexion__h3">Finalise ton inscription</h3>
            <h4 className="container-modaleConnexion__h4">
              Connecté·e avec {googleAuth.state.email} <HandMetal size={12} color="var(--brand-accent-dark, #F4B400)" />
            </h4>

            <section className="container-modaleConnexion__section">
              <TerritoryPicker id="google-territory" value={signupTerritory} onChange={setSignupTerritory} />
              <BirthDateField id="google-birthdate" value={birthDateGoogle} onChange={setBirthDateGoogle} />
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
                de {brandName}, et je certifie avoir au moins 18 ans.
              </label>

              {googleAuth.error && (
                <p className="container-modaleConnexion__error">{googleAuth.error}</p>
              )}

              <button
                type="button"
                className="container-modaleConnexion__submit"
                disabled={googleAuth.isSubmitting}
                onClick={() => googleAuth.completeSignup(termsAcceptedGoogle, signupTerritory, birthDateGoogle)}
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
        ) : (
          <div className="container-modaleConnexion">
            <img className="modal-brand" src={asset("logo")} alt="" />
            <h3 className="container-modaleConnexion__h3">Se connecter</h3>
            <h4 className="container-modaleConnexion__h4">
              Bienvenue chez {brandName} <HandMetal size={12} color="var(--brand-accent-dark, #F4B400)" />
            </h4>

            <section className="container-modaleConnexion__section">
              {googleAuth.state.step === "linkPending" && (
                <p className="container-modaleConnexion__info">
                  Un compte existe déjà avec {googleAuth.state.email}. Connecte-toi avec ton mot
                  de passe pour associer Google.
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
              </div>

              {googleAuth.error && googleAuth.state.step === "idle" && (
                <p className="container-modaleConnexion__error">{googleAuth.error}</p>
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
