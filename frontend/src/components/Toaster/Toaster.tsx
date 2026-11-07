import { useEffect, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { TOAST_EVENT, type ToastMessage } from "../../lib/toast";
import "./Toaster.scss";

const DURATION_MS = 4500;
const ICONS = { success: CheckCircle2, error: TriangleAlert, info: Info };

/** Pile des messages temporaires, en bas de l'écran (au-dessus de la barre du bas). */
export default function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    function handle(event: Event) {
      const message = (event as CustomEvent<ToastMessage>).detail;
      setToasts((current) => [...current.slice(-2), message]);
      window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== message.id)), DURATION_MS);
    }
    window.addEventListener(TOAST_EVENT, handle);
    return () => window.removeEventListener(TOAST_EVENT, handle);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((message) => {
        const Icon = ICONS[message.tone];
        return (
          <div
            key={message.id}
            className={`toaster__item toaster__item--${message.tone}`}
            role={message.tone === "error" ? "alert" : "status"}
          >
            <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
            <span>{message.text}</span>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setToasts((current) => current.filter((t) => t.id !== message.id))}
            >
              <X size={15} strokeWidth={2.6} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
