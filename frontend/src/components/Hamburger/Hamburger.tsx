import {
  Bike,
  CircleQuestionMark,
  Home,
  Info,
  Map,
  Menu,
  MessageCircleQuestion,
  Phone,
  SportShoe,
  Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Hamburger.scss";
import FollowUs from "../followUs/FollowUs";
import Carre from "../Carré/Carre";
import FooterBurger from "../FooterBurger/FooterBurger";

export default function Hamburger() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <div className={`navbar-panel ${isMenuOpen ? "show" : ""}`}>
        <ul
          id="mobile-navigation"
          className="navbar-list"
        >
          <li className="navbar-item">
            <NavLink to="/" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <Home size={14} color="currentColor" /> Accueil
              </span>
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/sports" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <Bike size={14} color="currentColor"/>Sports
              </span>
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/howsworking" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <Map size={14} color="currentColor" />
                Comment ça marche
              </span>
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/about" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <Info size={14} color="currentColor" />A propos
              </span>
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/why66partners" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <Star size={14} color="currentColor" />Pourquoi 66Partners?
              </span>
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/FAQ" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <CircleQuestionMark size={14} color="currentColor" />FAQ
              </span>
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/about" onClick={toggleMenu}>
              <span className="navbar-item__arrow">&gt;</span>
              <span className="navbar-item__label">
                <Phone size={14} color="currentColor" />Contact
              </span>
            </NavLink>
          </li>
        </ul>
        <FollowUs/>
        <Carre/>
        <FooterBurger/>
        </div>
      </nav>

    
    </>
  );
}
