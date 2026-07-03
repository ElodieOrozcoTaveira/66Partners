import { Menu } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import './Hamburger.scss';


export default function Hamburger() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-burger" onClick={toggleMenu}>
          <Menu />
        </div>
        <ul className={`navbar-list ${isMenuOpen ? 'show' : ''}`}>
          <li className="navbar-item">
            <NavLink to="/" onClick={toggleMenu}> Accueil</NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/sports" onClick={toggleMenu}>Sports</NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to='/howsworking' onClick={toggleMenu}>Comment ça marche</NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to='/about' onClick={toggleMenu}>A propos</NavLink>
          </li>
        </ul>
      </nav>

    </>
  );
}
