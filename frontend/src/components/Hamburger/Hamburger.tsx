import { Home, Info, Menu, MessageCircleQuestion, SportShoe } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Hamburger.scss";

export default function Hamburger() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <>
      <nav className="navbar">
        <button
          type="button"
          className="navbar-burger"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          <Menu />
        </button>
        <ul
          id="mobile-navigation"
          className={`navbar-list ${isMenuOpen ? "show" : ""}`}
        >
          <li className="navbar-item">
            <NavLink to="/" onClick={toggleMenu}>
             <Home size={18} color="#E6392E"/> Accueil
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/sports" onClick={toggleMenu}>
             <SportShoe size={18} color="#E6392E"/> Sports
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/howsworking" onClick={toggleMenu}>
               <MessageCircleQuestion size={18} color="#E6392E"/>Comment ça marche
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/about" onClick={toggleMenu}>
              <Info size={18} color="#E6392E"/>A propos
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}
