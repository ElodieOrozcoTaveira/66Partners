import { lazy, Suspense } from "react";
import { LockKeyhole } from "lucide-react";
import "./Modale.scss";

// Chargé à la demande : ModaleContent embarque react-icons (FaFacebook,
// FcGoogle — aucun équivalent lucide-react disponible pour ces logos), sinon
// présent dans le Header sur toutes les pages (cf. audit performance — P1).
const ModaleContent = lazy(() => import("../ModaleContent/ModaleContent"));

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
      <Suspense fallback={null}>
        <ModaleContent isOpen={isOpen} onClose={onClose} onSwitchToRegister={onSwitchToRegister} />
      </Suspense>
    </>
  );
}
