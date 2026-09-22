import { useEffect, useState, lazy, Suspense } from "react";
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
import "./Home.scss";

// Chargées à la demande : ces modales embarquent react-icons (FaFacebook,
// FcGoogle — aucun équivalent lucide-react disponible), sinon présentes dans
// le bundle initial via la Home (seule page conservée hors code-splitting —
// cf. audit performance P1).
const ModaleContent = lazy(
  () => import("../../components/ModaleConnexion/ModaleContent/ModaleContent"),
);
const ModaleRegisterContent = lazy(
  () => import("../../components/ModaleRegister/ModaleRegisteContent/ModaleRegisterContent"),
);
import Principe from "../../components/HomeComponents/Principe/Principe";
import SportsPop from "../../components/HomeComponents/SportPopulaire/SportsPop";
import ActivitésProche from "../../components/HomeComponents/ActivitésProche/AcitivtésProche";
import PourquoiHome from "../../components/HomeComponents/Pourquoi/PourquoiHome";
import { useBranding } from "../../contexts/TerritoryContext";

export default function Home() {
  const { taglineLead, taglineAccent, territoryOf } = useBranding();
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
              {taglineLead}
              <br />
              <span className="home-hero__titre-accent">{taglineAccent}</span>
            </h1>
            <p className="home-hero__soustitre">
              La plateforme des sportifs {territoryOf}.
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

      <Suspense fallback={null}>
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
      </Suspense>
      <Principe/>
      <SportsPop/>
      <ActivitésProche/>
      <PourquoiHome/>
    </>
  );
}
