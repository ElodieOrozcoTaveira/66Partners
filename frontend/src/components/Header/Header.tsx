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

const PUBLIC_NAV_LINKS = [
  { to: "/", label: "Accueil" },
  { to: "/sports", label: "Sports" },
  { to: "/fonctionnement", label: "Comment ça marche" },
  { to: "/pourquoi66", label: "Pourquoi 66Partners?" },
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
  const { user } = useAuth();
  const { unreadActivitiesCount } = useNotifications();
  const { territories, activeTerritory, setActiveTerritory } = useTerritory();
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );
  const location = useLocation();
  const hidden = useHideOnScroll();
  const isProfilePage = location.pathname === "/profile";
  const navLinks = user ? APP_NAV_LINKS : PUBLIC_NAV_LINKS;

  return (
    <header
      className={`container-header${hidden && !isProfilePage ? " container-header--hidden" : ""}${hideOnMobile ? " container-header--hide-mobile" : ""}`}
    >
      <section className="container-header__leftside">
        <NavLink to={"/"}>
          <img
            src="/logo3.webp"
            alt="logo 66partners"
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
        {/* Identité + territoire actif, visible dès le mobile (cf. audit PWA
            Étape 6). Le code seul devient un vrai sélecteur uniquement pour
            les comptes multi-territoires : inutile d'en afficher un pour les
            comptes 66 uniquement, qui restent la majorité en V1. */}
        {user && activeTerritory && (
          <div className="container-header__identity">
            <span className="container-header__identity-name">{user.pseudo}</span>
            <span className="container-header__identity-sep">·</span>
            {territories.length > 1 ? (
              <span className="container-header__territorySelectWrap">
                <select
                  className="container-header__territorySelect"
                  aria-label="Territoire actif"
                  value={activeTerritory.code}
                  onChange={(e) => setActiveTerritory(e.target.value)}
                >
                  {territories.map((territory) => (
                    <option key={territory.id} value={territory.code}>
                      {territory.code} — {territory.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  strokeWidth={2.5}
                  className="container-header__territoryChevron"
                  aria-hidden="true"
                />
              </span>
            ) : (
              <span className="container-header__identity-code">
                {activeTerritory.code}
              </span>
            )}
          </div>
        )}
        <Hamburger />
      </section>
    </header>
  );
}
