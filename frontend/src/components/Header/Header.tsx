import { useState } from "react";
import {  NavLink, useLocation } from "react-router-dom";
import "../Header/Header.scss";
import Hamburger from "../BurgerComponent/Hamburger/Hamburger";
import Connexion from "../BurgerComponent/Connexion/Connexion";
import TerritorySwitcher from "../TerritorySwitcher/TerritorySwitcher";
import { useHideOnScroll } from "../../hooks/useHideOnScroll";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
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
        {/* À partir de la tablette, le burger (et donc le badge territoire
            de Bonjour.tsx) disparaît au profit de la nav du Header — le même
            badge doit alors rester accessible ici (cf. Header.scss, masqué
            en mobile où Bonjour.tsx le montre déjà). */}
        <TerritorySwitcher className="container-header__territoryBadge" />
        <Hamburger />
      </section>
    </header>
  );
}
