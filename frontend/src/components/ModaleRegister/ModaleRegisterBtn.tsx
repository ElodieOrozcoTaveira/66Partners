import { UserPlus } from "lucide-react";
import ModaleRegisterContent from "./ModaleRegisteContent/ModaleRegisterContent";
import "./ModaleRegisterBtn/ModaleRegisterBtn.scss";
import "../BurgerComponent/Connexion/Connexion.scss";

interface ModaleRegisterBtnProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function ModaleRegisterBtn({ isOpen, onOpen, onClose, onSwitchToLogin }: ModaleRegisterBtnProps) {
  return (
    <>
      <button
        type="button"
        className="container-connexion__links2 modale-trigger"
        onClick={onOpen}
      >
        S'inscrire <UserPlus size={16} />
      </button>
      <ModaleRegisterContent isOpen={isOpen} onClose={onClose} onSwitchToLogin={onSwitchToLogin} />
    </>
  );
}
