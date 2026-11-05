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

// Connecté : navigation courte (comme les onglets de l'app mobile). Le profil
// passe par l'avatar à droite ; FAQ et Contact restent dans le pied de page.
const APP_NAV_LINKS = [
  { to: "/dashboard", label: "Accueil" },
  { to: "/explorer", label: "Activités" },
  { to: "/sports", label: "Sports" },
  { to: "/messages", label: "Messages" },
  { to: "/mesactivités", label: "Mes activités" },
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
          {/* Logo principal de la plateforme (blanc), mis en valeur par le
              fond dégradé de l'en-tête ; chaque territoire garde son logo
              ailleurs (pied de page, fenêtres de connexion…). */}
          <img
            src="/newLogo.webp"
            alt={brandName}
            className="left-side__img"
            width={153}
            height={78}
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
            en mobile où Bonjour.tsx le montre déjà). Réservé aux connectés :
            un visiteur choisit son territoire principal à l'inscription
            (TerritoryPicker), jamais avant — aucun changement de territoire
            possible tant qu'on n'est pas connecté. */}
        {user && <TerritorySwitcher className="container-header__territoryBadge" />}
        {user && (
          <NavLink
            to="/profile"
            className="container-header__avatar"
            aria-label="Mon profil"
            title="Mon profil"
          >
            <img src={user.avatar || asset("avatarDefault")} alt="" width={38} height={38} />
          </NavLink>
        )}
        <Hamburger />
      </section>
    </header>
  );
}
