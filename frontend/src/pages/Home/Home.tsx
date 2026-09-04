import { useEffect, useState } from "react";
import {
  Compass,
  ChevronRight,
  Users,
  Calendar,
  MapPin,
  ShieldCheck,
} from "lucide-react";
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

  const heroFeatures = [
    {
      id: 1,
      icon: Users,
      titre: "Trouve",
      description: "des sportifs près de toi",
    },
    {
      id: 2,
      icon: Calendar,
      titre: "Rejoins",
      description: "des activités facilement",
    },
    {
      id: 3,
      icon: MapPin,
      titre: "Partage",
      description: "tes passions sportives",
    },
    {
      id: 4,
      icon: ShieldCheck,
      titre: "Évolue",
      description: "en toute sécurité",
    },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__photo-wrap">
          <span className="home-hero__flag" aria-hidden="true" />

          <div className="home-hero__intro">
            <h1 className="home-hero__titre">
              Ton sport.
              <br />
              Ton partenaire.
              <br />
              <span className="home-hero__titre-accent">Ton 66.</span>
            </h1>
            <p className="home-hero__soustitre">
              La plateforme des sportifs des Pyrénées-Orientales.
            </p>
          </div>
        </div>

        <div className="home-hero__card">
          <ul className="home-hero__features">
            {heroFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.id} className="home-hero__feature">
                  <Icon size={22} className="home-hero__feature-icon" />
                  <span className="home-hero__feature-titre">
                    {feature.titre}
                  </span>
                  <span className="home-hero__feature-desc">
                    {feature.description}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="home-hero__actions">
            <NavLink
              to="/explorer"
              className="home-hero__btn"
              onClick={handleExplorerClick}
            >
              <Compass size={18} /> Découvrir les activités
            </NavLink>
            <NavLink to="/fonctionnement" className="home-hero__more">
              En savoir plus <ChevronRight size={14} />
            </NavLink>
          </div>
        </div>
      </section>

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
