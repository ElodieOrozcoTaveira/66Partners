import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Connexion.scss";
import ModaleBtn from "../../ModaleConnexion/ModaleBtn/ModaleBtn";
import ModaleRegisterBtn from "../../ModaleRegister/ModaleRegisterBtn";
import { useAuth } from "../../../contexts/AuthContext";

interface ConnexionProps {
  activeModal: "login" | "register" | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onClose: () => void;
}

export default function Connexion({ activeModal, onOpenLogin, onOpenRegister, onClose }: ConnexionProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container-connexion">
      {user && (
        <button
          type="button"
          className="container-connexion__links1"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <LogOut size={16} /> Se déconnecter
        </button>
      )}
      {/*
        Kept mounted (just visually hidden) even once `user` becomes truthy,
        so ModaleRegisterContent's post-registration welcome step survives
        the auth state change instead of being unmounted mid-flow. The modals
        themselves render via a portal to document.body, so this wrapper's
        display:none doesn't hide them.
      */}
      <div style={{ display: user ? "none" : "contents" }}>
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
    </div>
  );
}
