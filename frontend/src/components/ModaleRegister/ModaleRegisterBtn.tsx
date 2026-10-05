import { lazy, Suspense } from "react";
import { UserPlus } from "lucide-react";
import "./ModaleRegisterBtn/ModaleRegisterBtn.scss";
import "../BurgerComponent/Connexion/Connexion.scss";

// Chargé à la demande : ModaleRegisterContent embarque react-icons
// (FaFacebook, FcGoogle — aucun équivalent lucide-react disponible pour ces
// logos), sinon présent dans le Header sur toutes les pages (cf. audit
// performance — P1).
const ModaleRegisterContent = lazy(
  () => import("./ModaleRegisteContent/ModaleRegisterContent"),
);

interface ModaleRegisterBtnProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function ModaleRegisterBtn({
  isOpen,
  onOpen,
  onClose,
  onSwitchToLogin,
}: ModaleRegisterBtnProps) {
  return (
    <>
      <button
        type="button"
        className="container-connexion__links2 modale-trigger"
        onClick={onOpen}
      >
        <UserPlus size={16} /> S'inscrire
      </button>
      <Suspense fallback={null}>
        <ModaleRegisterContent
          isOpen={isOpen}
          onClose={onClose}
          onSwitchToLogin={onSwitchToLogin}
        />
      </Suspense>
    </>
  );
}
