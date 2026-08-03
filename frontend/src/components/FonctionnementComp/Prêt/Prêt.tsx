import { useState } from "react";
import { UserPlus } from "lucide-react";
import "./Prêt.scss";
import ModaleContent from "../../ModaleConnexion/ModaleContent/ModaleContent";
import ModaleRegisterContent from "../../ModaleRegister/ModaleRegisteContent/ModaleRegisterContent";

export default function Prêt() {
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  return (
    <>
      <div className="container-prêt">
        <h3 className="container-prêt__h3">
          Rejoins les sportifs des Pyrénées-Orientales
        </h3>
        <button
          type="button"
          className="container-prêt__link"
          onClick={() => setActiveModal("register")}
        >
          Créer un compte <UserPlus size={12} color="#ff4500" />
        </button>
      </div>

      <ModaleContent
        isOpen={activeModal === "login"}
        onClose={() => setActiveModal(null)}
        onSwitchToRegister={() => setActiveModal("register")}
      />
      <ModaleRegisterContent
        isOpen={activeModal === "register"}
        onClose={() => setActiveModal(null)}
        onSwitchToLogin={() => setActiveModal("login")}
      />
    </>
  );
}
