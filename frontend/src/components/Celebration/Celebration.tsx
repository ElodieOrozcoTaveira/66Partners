import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import "./Celebration.scss";

interface CelebrationProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const CONFETTI = Array.from({ length: 16 }, (_, index) => index);

/**
 * Moment de réussite (demande envoyée, activité publiée), comme l'app
 * mobile : coche qui rebondit et confettis aux couleurs du territoire.
 * Animations coupées si l'utilisateur a réduit les animations.
 */
export default function Celebration({ open, title, message, onClose }: CelebrationProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="celebration" onClick={onClose}>
      <div
        className="celebration__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="celebration__burst" aria-hidden="true">
          {CONFETTI.map((index) => (
            <span
              key={index}
              className="celebration__confetti"
              style={
                {
                  "--angle": `${(index / CONFETTI.length) * 360}deg`,
                  "--distance": `${index % 2 ? 78 : 104}px`,
                  "--spin": `${index * 47}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <span className="celebration__check">
            <Check size={42} strokeWidth={3} />
          </span>
        </div>
        <h2 id="celebration-title" className="celebration__title">
          {title}
        </h2>
        <p className="celebration__message">{message}</p>
        <button type="button" className="btn btn--primary celebration__button" onClick={onClose} autoFocus>
          Super !
        </button>
      </div>
    </div>,
    document.body,
  );
}
