import { useState, type FormEvent } from "react";
import api from "../../lib/axios";
import "./Contact.scss";

interface ContactResponse {
  success: boolean;
  message: string;
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");
    try {
      await api.post<ContactResponse>("/api/contact", { name, email, message });
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="container-contact">
      <h1 className="container-contact__titre">Contactez-nous</h1>
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
          <p className="container-contact__success">Votre message a bien été envoyé, merci !</p>
        )}
        {status === "error" && (
          <p className="container-contact__error">
            Une erreur est survenue, réessayez ou écrivez-nous directement à contact@66partners.fr.
          </p>
        )}

        <button type="submit" className="container-contact__submit" disabled={status === "sending"}>
          {status === "sending" ? "Envoi..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
