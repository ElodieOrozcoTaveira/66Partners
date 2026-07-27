import { useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { PartyPopper, X } from "lucide-react";
import "./ModaleBienvenue.scss";

interface ModaleBienvenueProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModaleBienvenue({ isOpen, onClose }: ModaleBienvenueProps) {
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

  if (!isOpen) return null;

  return createPortal(
    <div className="modale-bienvenue-overlay" onClick={onClose}>
      <div
        className="modale-bienvenue-content"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modale-bienvenue-content__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <div className="container-modaleBienvenue">
          <h3 className="container-modaleBienvenue__h3">
            Bienvenue sur 66Partners <PartyPopper size={18} color="#F4B400" />
          </h3>
          <h4 className="container-modaleBienvenue__h4">
            Ton compte est prêt ! Établis ton profil et crée tes premières
            activités pour rencontrer d'autres sportifs près de chez toi.
          </h4>

          <div className="container-modaleBienvenue__actions">
            <NavLink
              to="/profile"
              className="container-modaleBienvenue__submit"
              onClick={onClose}
            >
              Compléter mon profil
            </NavLink>
            <button
              type="button"
              className="container-modaleBienvenue__later"
              onClick={onClose}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
