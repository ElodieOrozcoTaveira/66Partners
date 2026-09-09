import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import "./Contact.scss";
import { Send } from "lucide-react";
import HeroComponent from "../../components/ContactComponents/HeroComponent/HeroComponent";
import AvantContact from "../../components/ContactComponents/AvantContact/AvantContact";
import Satisfaction from "../../components/ContactComponents/Satisfation/Satisfaction";
import Question from "../../components/ContactComponents/Question/Question";

interface ContactResponse {
  success: boolean;
  message: string;
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    try {
      await api.post<ContactResponse>("/api/contact", { name, email, message });
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      // Diagnostic minimal, indispensable pour distinguer un vrai échec
      // serveur d'une simple coupure réseau/timeout (cf. audit mobile) —
      // l'ancien catch silencieux ne laissait aucune trace exploitable.
      console.error("Erreur envoi formulaire de contact:", err);
      if (isAxiosError(err) && !err.response) {
        // Pas de réponse du serveur : timeout ou requête jamais partie
        // (réseau mobile instable, tunnel coupé...), pas une erreur métier.
        setErrorMessage(
          "Connexion impossible. Vérifiez votre réseau et réessayez.",
        );
      } else {
        setErrorMessage(null);
      }
      setStatus("error");
    }
  }

  return (
    <>
      <HeroComponent />
      <div className="container-contact-row">
        <AvantContact />
        <div className="container-contact-row__divider"></div>
        <Satisfaction />
      </div>

      <div className="container-contact">
        <h1 className="container-contact__titre">
          <Send size={20} color="#C62828" /> Envoyez-nous un message
        </h1>
        <p className="container-contact__soustitre">
          Une question ? Écrivez-nous, on vous répond au plus vite.
        </p>

        <form className="container-contact__form" onSubmit={handleSubmit}>
          <label htmlFor="name" className="container-contact__label">
            Nom
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="container-contact__input"
          />

          <label htmlFor="email" className="container-contact__label">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="container-contact__input"
          />

          <label htmlFor="message" className="container-contact__label">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="container-contact__textarea"
          />

          {status === "sent" && (
            <p className="container-contact__success">
              Votre message a bien été envoyé, merci !
            </p>
          )}
          {status === "error" && (
            <p className="container-contact__error">
              {errorMessage ??
                "Une erreur est survenue, réessayez ou écrivez-nous directement à contact@66partners.fr."}
            </p>
          )}

          <button
            type="submit"
            className="container-contact__submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Envoi..." : "Envoyer le message "}
          </button>
        </form>
      </div>
      <Question />
    </>
  );
}
