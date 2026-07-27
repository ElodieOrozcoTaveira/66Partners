import {
  Bike,
  CircleQuestionMark,
  Home,
  Map,
  Menu,
  Mail,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Hamburger.scss";
import FollowUs from "../followUs/FollowUs";
import Connexion from "../Connexion/Connexion";
import Bonjour from "../Bonjour/Bonjour";

export default function Hamburger() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );
  const navRef = useRef<HTMLElement>(null);

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
          color="#1E2A38"
        >
          <Menu />
        </button>
        <div
          className={`navbar-overlay ${isMenuOpen ? "show" : ""}`}
          onClick={toggleMenu}
          aria-hidden="true"
        />
        <div className={`navbar-panel ${isMenuOpen ? "show" : ""}`}>
          <Bonjour />

          <ul id="mobile-navigation" className="navbar-list">
            <li className="navbar-item">
              <NavLink to="/" onClick={toggleMenu}>
                <span className="navbar-item__arrow">&gt;</span>
                <span className="navbar-item__label">
                  <span className="navbar-item__icon">
                    <Home size={14} color="currentColor" />
                  </span>
                  Accueil
                </span>
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/sports" onClick={toggleMenu}>
                <span className="navbar-item__arrow">&gt;</span>
                <span className="navbar-item__label">
                  <span className="navbar-item__icon">
                    <Bike size={14} color="currentColor" />
                  </span>
                  Sports
                </span>
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/fonctionnement" onClick={toggleMenu}>
                <span className="navbar-item__arrow">&gt;</span>
                <span className="navbar-item__label">
                  <span className="navbar-item__icon">
                    <Map size={14} color="currentColor" />
                  </span>
                  Comment ça marche
                </span>
              </NavLink>
            </li>

            <li className="navbar-item">
              <NavLink to="/pourquoi66" onClick={toggleMenu}>
                <span className="navbar-item__arrow">&gt;</span>
                <span className="navbar-item__label">
                  <span className="navbar-item__icon">
                    <Star size={14} color="currentColor" />
                  </span>
                  Pourquoi 66Partners?
                </span>
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/FAQ" onClick={toggleMenu}>
                <span className="navbar-item__arrow">&gt;</span>
                <span className="navbar-item__label">
                  <span className="navbar-item__icon">
                    <CircleQuestionMark size={14} color="currentColor" />
                  </span>
                  FAQ
                </span>
              </NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/contact" onClick={toggleMenu}>
                <span className="navbar-item__arrow">&gt;</span>
                <span className="navbar-item__label">
                  <span className="navbar-item__icon">
                    <Mail size={14} color="currentColor" />
                  </span>
                  Contact
                </span>
              </NavLink>
            </li>
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
