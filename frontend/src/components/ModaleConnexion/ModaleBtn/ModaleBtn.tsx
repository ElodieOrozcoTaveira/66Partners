import { LockKeyhole } from "lucide-react";
import ModaleContent from "../ModaleContent/ModaleContent";
import "./Modale.scss";

interface ModaleBtnProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function ModaleBtn({ isOpen, onOpen, onClose, onSwitchToRegister }: ModaleBtnProps) {
  return (
    <>
      <button
        type="button"
        className="container-connexion__links1 modale-trigger"
        onClick={onOpen}
      >
        <LockKeyhole size={16} />Se connecter 
      </button>
      <ModaleContent isOpen={isOpen} onClose={onClose} onSwitchToRegister={onSwitchToRegister} />
    </>
  );
}
