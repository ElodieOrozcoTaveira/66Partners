import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ModaleContent from "../../components/ModaleConnexion/ModaleContent/ModaleContent";
import ModaleRegisterContent from "../../components/ModaleRegister/ModaleRegisteContent/ModaleRegisterContent";
import "./Home.scss";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  useEffect(() => {
    if (activeModal && user) {
      setActiveModal(null);
      navigate("/explorer");
    }
  }, [activeModal, user, navigate]);

  function handleExplorerClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!user) {
      event.preventDefault();
      setActiveModal("login");
    }
  }

  return (
    <>
      <div className="container-home">
        <section className="container-home__leftside">
          <h3 className="container-home__h3">La plateforme qui connecte</h3>
          <h4 className="container-home__h4">
            les sportifs des Pyrénées-Orientales
          </h4>
          <h1 className="container-home__h1">
            Ton sport.
            <br />
            Ton partenaire.
            <br />
            <span className="container-home__span">Ton 66.</span>
          </h1>
          <p className="container-home__p">
            Découvre, partage et vis des expériences sportives uniques près de
            chez toi.
          </p>
          <NavLink
            to="/explorer"
            className="container-home__explorer"
            onClick={handleExplorerClick}
          >
            Explorer les activités <ArrowRight size={12} color="#ffffff" />
          </NavLink>
        </section>
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
