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
import { NavLink } from "react-router-dom";
import "./Hamburger.scss";
import FollowUs from "../followUs/FollowUs";
import Connexion from "../Connexion/Connexion";
import Bonjour from "../Bonjour/Bonjour";
import { useAuth } from "../../../contexts/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const PUBLIC_NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/sports", label: "Sports", icon: Bike },
  { to: "/fonctionnement", label: "Comment ça marche", icon: Map },
  { to: "/pourquoi66", label: "Pourquoi 66Partners?", icon: Star },
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
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );
  const navRef = useRef<HTMLElement>(null);
  const navItems = user ? APP_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      </nav>
    </>
  );
}
