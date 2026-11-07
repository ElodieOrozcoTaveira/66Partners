import { useEffect, useState, lazy, Suspense } from "react";
import { ArrowRight, BellRing, CheckCircle2, Compass, MapPin, Sparkles } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Home.scss";

// Chargées à la demande : ces modales embarquent react-icons (
// FcGoogle — aucun équivalent lucide-react disponible), sinon présentes dans
// le bundle initial via la Home (seule page conservée hors code-splitting —
// cf. audit performance P1).
const ModaleContent = lazy(
  () => import("../../components/ModaleConnexion/ModaleContent/ModaleContent"),
);
const ModaleRegisterContent = lazy(
  () => import("../../components/ModaleRegister/ModaleRegisteContent/ModaleRegisterContent"),
);
import SportsMarquee from "../../components/HomeComponents/SportsMarquee/SportsMarquee";
import Bento from "../../components/HomeComponents/Bento/Bento";
import ActivitésProche from "../../components/HomeComponents/ActivitésProche/AcitivtésProche";
import HowItWorks from "../../components/HomeComponents/HowItWorks/HowItWorks";
import PourquoiHome from "../../components/HomeComponents/Pourquoi/PourquoiHome";
import NouveauLook, { NOUVEAU_LOOK_ID } from "../../components/HomeComponents/NouveauLook/NouveauLook";
import SuisNous from "../../components/HomeComponents/Facebook/SuisNous";
import { useBranding } from "../../contexts/TerritoryContext";

export default function Home() {
  const { taglineLeadLines, taglineAccent, asset, brandName, territoryIn } = useBranding();
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

  const openRegister = () => (user ? navigate("/dashboard") : setActiveModal("register"));

  return (
    <>
      <section className="home-hero">
        <div className="home-hero__banner page-container">
          <img className="home-hero__bg" src={asset("hero")} alt="" />
          <div className="home-hero__overlay" />
          <div className="home-hero__intro">
            <a
              href={`#${NOUVEAU_LOOK_ID}`}
              className="home-hero__new"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(NOUVEAU_LOOK_ID)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="home-hero__new-tag">
                <Sparkles size={12} strokeWidth={2.6} /> Nouveau
              </span>
              {brandName} s'est refait une beauté
              <ArrowRight size={14} />
            </a>
            <h1 className="home-hero__titre">
              {taglineLeadLines.map((line) => (
                <span key={line} className="home-hero__titre-ligne">{line}</span>
              ))}
              <span className="home-hero__titre-ligne home-hero__titre-accent">{taglineAccent}</span>
            </h1>
            <p className="home-hero__soustitre">
              La plateforme qui regroupe tous les sportifs. <br></br> Trouve des partenaires, rejoins une
              sortie en un clic et retrouve le groupe sur place.
            </p>
            <div className="home-hero__actions">
              <NavLink to="/explorer" className="btn btn--primary" onClick={handleExplorerClick}>
                <Compass size={18} /> Découvrir les activités
              </NavLink>
              <button type="button" className="btn btn--light" onClick={openRegister}>
                {user ? "Mon tableau de bord" : "Créer mon compte"} <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <div className="home-hero__toasts" aria-hidden="true">
            <div className="home-hero__toast">
              <span className="home-hero__toast-icon">
                <MapPin size={16} />
              </span>
              Des sorties près de chez toi
            </div>
            <div className="home-hero__toast">
              <span className="home-hero__toast-icon home-hero__toast-icon--accent">
                <BellRing size={16} />
              </span>
              Rappel : c'est demain !
            </div>
            <div className="home-hero__toast">
              <span className="home-hero__toast-icon home-hero__toast-icon--ok">
                <CheckCircle2 size={16} />
              </span>
              Demande acceptée · Footing du dimanche
            </div>
          </div>
        </div>
      </section>

      <SportsMarquee />

      <NouveauLook />

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

      <ActivitésProche />
      <SuisNous />
      <HowItWorks />
      <Bento />
      <PourquoiHome />

      <section className="home-final page-container">
        <div className="home-final__inner" style={{ backgroundImage: `url(${asset("cover")})` }}>
          <div className="home-final__tint" />
          <div className="home-final__content">
            <h2 className="home-final__titre">Prêt à bouger {territoryIn}&nbsp;?</h2>
            <p className="home-final__texte">
              Rejoins la communauté {brandName} : c'est gratuit, et ta prochaine sortie
              est peut-être déjà en ligne.
            </p>
            <div className="home-final__actions">
              <NavLink to="/explorer" className="btn btn--accent" onClick={handleExplorerClick}>
                <Compass size={18} /> Voir les activités
              </NavLink>
              {!user ? (
                <button type="button" className="btn btn--light" onClick={() => setActiveModal("register")}>
                  Créer mon compte
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
