import {
  Bike,
  CalendarDays,
  CircleQuestionMark,
  Flag,
  Home,
  Map,
  Menu,
  Mail,
  MessageSquareMore,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import "./Hamburger.scss";
import FollowUs from "../followUs/FollowUs";
import Connexion from "../Connexion/Connexion";
import Bonjour from "../Bonjour/Bonjour";
import { useAuth } from "../../../contexts/AuthContext";
import { useBranding } from "../../../contexts/TerritoryContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/sports", label: "Sports", icon: Bike },
  { to: "/fonctionnement", label: "Comment ça marche", icon: Map },
  { to: "/pourquoi66", label: "Pourquoi {brand}?", icon: Star },
  { to: "/FAQ", label: "FAQ", icon: CircleQuestionMark },
  { to: "/contact", label: "Contact", icon: Mail },
];

const APP_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/sports", label: "Sports", icon: Bike },
  { to: "/explorer", label: "Activités", icon: CalendarDays },
  { to: "/messages", label: "Messages", icon: MessageSquareMore },
  { to: "/mesactivités", label: "Mes activités", icon: Flag },
  { to: "/FAQ", label: "FAQ", icon: CircleQuestionMark },
  { to: "/contact", label: "Contact", icon: Mail },
];

export default function Hamburger() {
  const { brandName } = useBranding();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );
  const navRef = useRef<HTMLElement>(null);
  const navItems = (user ? APP_NAV_ITEMS : PUBLIC_NAV_ITEMS).map((item) => ({
    ...item,
    label: item.label.replace("{brand}", brandName),
  }));

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Le menu déroulant de TerritorySwitcher est rendu via portail sur
      // <body> (cf. TerritorySwitcher.tsx), donc jamais un descendant DOM de
      // .navbar : sans cette exclusion, navRef.contains() le traite à tort
      // comme "en dehors" et referme tout le panneau burger en pleine
      // sélection d'un territoire. Détection par classe (générique, déjà
      // utilisée par ce composant partout ailleurs) plutôt qu'une référence
      // couplée à Bonjour/TerritorySwitcher.
      const insideTerritoryMenu = (target as Element | null)?.closest?.(".territory-switcher__menu");
      // Le panneau lui-même est désormais rendu via portail sur <body> (cf.
      // plus bas — un ancêtre de page (.page-transition) applique un
      // transform, ce qui transforme tout position:fixed descendant en
      // position relative à CET ancêtre plutôt qu'au viewport, cassant le
      // "hors écran" du panneau fermé quand Hamburger est monté dans une
      // page plutôt que dans le Header — cf. audit UX, overflow /profile) :
      // jamais un descendant DOM de .navbar, même égarement que pour le menu
      // territoire ci-dessus.
      const insideNavbarPanel = (target as Element | null)?.closest?.(".navbar-panel");
      if (
        navRef.current &&
        !navRef.current.contains(target) &&
        !insideTerritoryMenu &&
        !insideNavbarPanel
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Empêche le scroll de la page derrière le panneau (même convention que
  // les modales de connexion/inscription) : sans ça, le fond défile encore
  // au doigt sous le panneau sur mobile, ce qui casse la sensation d'app.
  useEffect(() => {
    if (!isMenuOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="navbar" ref={navRef}>
        <button
          type="button"
          className={`navbar-burger ${isMenuOpen ? "is-hidden" : ""}`}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <Menu />
        </button>
      </nav>
      {/*
        Rendu via portail sur <body> — pas seulement par convention (même
        technique que TerritorySwitcher/ConfirmDialog) mais par nécessité :
        .navbar-panel compte sur position:fixed pour glisser entièrement hors
        écran une fois fermé (transform: translateX(100%)), ce qui suppose
        qu'il soit positionné par rapport au viewport. Dès que Hamburger est
        monté à l'intérieur d'une page (ex. HeroProfile sur /profile) plutôt
        que dans le Header, l'ancêtre .page-transition applique un transform
        (même l'identité) qui redevient le point de référence de tout
        descendant position:fixed — le panneau fermé reste alors
        partiellement dans le viewport (~15px sur mobile), d'où le scroll
        horizontal parasite. Le portail le sort de cette chaîne d'ancêtres
        quel que soit l'endroit où <Hamburger/> est monté.
      */}
      {createPortal(
        <>
          <div
            className={`navbar-overlay ${isMenuOpen ? "show" : ""}`}
            onClick={toggleMenu}
            aria-hidden="true"
          />
          <div className={`navbar-panel ${isMenuOpen ? "show" : ""}`}>
            <Bonjour onNavigate={toggleMenu} />

            <ul id="mobile-navigation" className="navbar-list">
              {navItems.map((item) => (
                <li className="navbar-item" key={item.to}>
                  <NavLink to={item.to} onClick={toggleMenu}>
                    <span className="navbar-item__arrow">&gt;</span>
                    <span className="navbar-item__label">
                      <span className="navbar-item__icon">
                        <item.icon size={14} color="currentColor" />
                      </span>
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
            <Connexion
              activeModal={activeModal}
              onOpenLogin={() => setActiveModal("login")}
              onOpenRegister={() => setActiveModal("register")}
              onClose={() => setActiveModal(null)}
            />

            <FollowUs />
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
