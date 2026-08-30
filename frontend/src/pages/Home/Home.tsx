import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ModaleContent from "../../components/ModaleConnexion/ModaleContent/ModaleContent";
import ModaleRegisterContent from "../../components/ModaleRegister/ModaleRegisteContent/ModaleRegisterContent";
import "./Home.scss";
import Principe from "../../components/HomeComponents/Principe/Principe";
import SportsPop from "../../components/HomeComponents/SportPopulaire/SportsPop";
import ActivitésProche from "../../components/HomeComponents/ActivitésProche/AcitivtésProche";
import PourquoiHome from "../../components/HomeComponents/Pourquoi/PourquoiHome";

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

          <div className="container-home__cta">
            <NavLink
              to="/explorer"
              className="container-home__btn container-home__btn--primary"
              onClick={handleExplorerClick}
            >
              <Compass size={16} /> Découvrir les activités
            </NavLink>
          </div>
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
      <Principe/>
      <SportsPop/>
      <ActivitésProche/>
      <PourquoiHome/>
    </>
  );
}
