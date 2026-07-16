import "./Connexion.scss";
import ModaleBtn from "../../ModaleConnexion/ModaleBtn/ModaleBtn";
import ModaleRegisterBtn from "../../ModaleRegister/ModaleRegisterBtn";

interface ConnexionProps {
  activeModal: "login" | "register" | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onClose: () => void;
}

export default function Connexion({ activeModal, onOpenLogin, onOpenRegister, onClose }: ConnexionProps) {
  return (
    <>
      <div className="container-connexion">
        <ModaleBtn
          isOpen={activeModal === "login"}
          onOpen={onOpenLogin}
          onClose={onClose}
          onSwitchToRegister={onOpenRegister}
        />
        <ModaleRegisterBtn
          isOpen={activeModal === "register"}
          onOpen={onOpenRegister}
          onClose={onClose}
          onSwitchToLogin={onOpenLogin}
        />
      </div>
    </>
  );
}
