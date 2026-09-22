import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {  NavLink, useLocation } from "react-router-dom";
import "../Header/Header.scss";
import Hamburger from "../BurgerComponent/Hamburger/Hamburger";
import Connexion from "../BurgerComponent/Connexion/Connexion";
import { useHideOnScroll } from "../../hooks/useHideOnScroll";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import { useTerritory } from "../../contexts/TerritoryContext";
import { useBranding } from "../../contexts/TerritoryContext";

const PUBLIC_NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/sports", label: "Sports" },
  { to: "/fonctionnement", label: "Comment ça marche" },
  { to: "/pourquoi66", label: "Pourquoi {brand}?" },
  { to: "/FAQ", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const APP_NAV_LINKS = [
  { to: "/dashboard", label: "Accueil" },
  { to: "/sports", label: "Sports" },
  { to: "/explorer", label: "Activités" },
  { to: "/messages", label: "Messages" },
  { to: "/mesactivités", label: "Mes activités" },
  { to: "/profile", label: "Mon profil" },
  { to: "/FAQ", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

interface HeaderProps {
  /** Masqué en mobile, visible à partir de la tablette (cf. Profil/Dashboard,
   * qui intègrent leur propre menu burger dans la photo de couverture en mobile). */
  hideOnMobile?: boolean;
}

export default function Header({ hideOnMobile = false }: HeaderProps) {
  const { brandName, asset } = useBranding();
  const { user } = useAuth();
  const { unreadActivitiesCount } = useNotifications();
  const { selectableTerritories, activeTerritory, setActiveTerritory } = useTerritory();
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );
  const location = useLocation();
  const hidden = useHideOnScroll();
  const isProfilePage = location.pathname === "/profile";
  const navLinks = (user ? APP_NAV_LINKS : PUBLIC_NAV_LINKS).map((link) => ({
    ...link,
    label: link.label.replace("{brand}", brandName),
  }));

  return (
    <header
      className={`container-header${hidden && !isProfilePage ? " container-header--hidden" : ""}${hideOnMobile ? " container-header--hide-mobile" : ""}`}
    >
      <section className="container-header__leftside">
        <NavLink to={"/"}>
          <img
            src={asset("logo")}
            alt={`logo ${brandName}`}
            className="left-side__img"
            width={153}
            height={100}
            loading="lazy"
          
                      />
        </NavLink>
      </section>
      <nav className="container-header__nav">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to}>
            {link.label}
            {link.to === "/mesactivités" && unreadActivitiesCount > 0 && (
              <span className="container-header__navBadge">
                {unreadActivitiesCount > 9 ? "9+" : unreadActivitiesCount}
              </span>
            )}
          </NavLink>
        ))}
        <Connexion
          activeModal={activeModal}
          onOpenLogin={() => setActiveModal("login")}
          onOpenRegister={() => setActiveModal("register")}
          onClose={() => setActiveModal(null)}
        />
      </nav>
      <section className="container-header__rightside">
        {/* Territoire actif = contexte d'utilisation (jamais une autre
            application) : onglet `34` (code département) avec chevron, quel
            que soit l'utilisateur (dernier territoire choisi, sinon premier
            territoire actif). Le clic fait défiler les territoires
            sélectionnables un par un — activé dès maintenant côté front
            même si la liste des territoires n'est pas encore calée côté
            back (un seul territoire = le clic ne change rien). */}
        {activeTerritory && (
          <div className="container-header__identity">
            <button
              type="button"
              className="container-header__territoryTab"
              aria-label={`Territoire actif : ${activeTerritory.name}. Changer de territoire`}
              onClick={() => {
                const currentIndex = selectableTerritories.findIndex(
                  (territory) => territory.code === activeTerritory.code,
                );
                const next =
                  selectableTerritories[(currentIndex + 1) % selectableTerritories.length];
                setActiveTerritory(next.code);
              }}
            >
              <span className="container-header__territoryLabel">{activeTerritory.code}</span>
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                className="container-header__territoryChevron"
                aria-hidden="true"
              />
            </button>
          </div>
        )}
        <Hamburger />
      </section>
    </header>
  );
}
