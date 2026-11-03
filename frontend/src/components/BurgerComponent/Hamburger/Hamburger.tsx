import {
  Bike,
  CalendarDays,
  ChevronRight,
  CircleQuestionMark,
  Flag,
  Home,
  Map,
  Menu,
  Mail,
  MessageSquareMore,
  Star,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { SiInstagram } from "react-icons/si";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import "./Hamburger.scss";
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
  { to: "/dashboard", label: "Accueil", icon: Home },
  { to: "/sports", label: "Sports", icon: Bike },
  { to: "/explorer", label: "Activités", icon: CalendarDays },
  { to: "/messages", label: "Messages", icon: MessageSquareMore },
  { to: "/mesactivités", label: "Mes activités", icon: Flag },
  { to: "/profile", label: "Mon profil", icon: UserRound },
  { to: "/FAQ", label: "FAQ", icon: CircleQuestionMark },
  { to: "/contact", label: "Contact", icon: Mail },
];

export default function Hamburger() {
  const { brandName, taglineLead, taglineAccent } = useBranding();
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
          <div
            className={`navbar-panel ${isMenuOpen ? "show" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <button
              type="button"
              className="navbar-panel__close"
              onClick={toggleMenu}
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
            <Bonjour onNavigate={toggleMenu} />

            <p className="navbar-panel__section">Navigation</p>
            <ul id="mobile-navigation" className="navbar-list">
              {navItems.map((item) => (
                <li className="navbar-item" key={item.to}>
                  <NavLink to={item.to} end={item.to === "/"} onClick={toggleMenu}>
                    <span className="navbar-item__icon">
                      <item.icon size={18} color="currentColor" />
                    </span>
                    <span className="navbar-item__label">{item.label}</span>
                    <ChevronRight className="navbar-item__chevron" size={18} />
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

            <div className="navbar-panel__footer">
              <p className="navbar-panel__tagline">
                {taglineLead} <span>{taglineAccent}</span>
              </p>
              <div className="navbar-panel__social">
                <span>Suivez-nous</span>
                <a
                  href="https://www.instagram.com/66par.tners/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Suivez-nous sur Instagram"
                >
                  <SiInstagram size={17} />
                </a>
                <a
                  href="https://www.facebook.com/66Partners"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Suivez-nous sur Facebook"
                >
                  <FaFacebook size={18} />
                </a>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
