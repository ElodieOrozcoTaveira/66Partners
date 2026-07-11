import { useState } from "react";
import "./Connexion.scss";
import ModaleBtn from "../../ModaleConnexion/ModaleBtn/ModaleBtn";
import ModaleRegisterBtn from "../../ModaleRegister/ModaleRegisterBtn";

export default function Connexion() {
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  return (
    <>
      <div className="container-connexion">
        <ModaleBtn
          isOpen={activeModal === "login"}
          onOpen={() => setActiveModal("login")}
          onClose={() => setActiveModal(null)}
          onSwitchToRegister={() => setActiveModal("register")}
        />
        <ModaleRegisterBtn
          isOpen={activeModal === "register"}
          onOpen={() => setActiveModal("register")}
          onClose={() => setActiveModal(null)}
          onSwitchToLogin={() => setActiveModal("login")}
        />
      </div>
    </>
  );
}
