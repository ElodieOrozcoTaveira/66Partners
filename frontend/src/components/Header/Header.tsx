import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../Header/Header.scss";
import Hamburger from "../BurgerComponent/Hamburger/Hamburger";
import Connexion from "../BurgerComponent/Connexion/Connexion";

export default function Header() {
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  return (
    <header className="container-header">
      <section className="container-header__leftside">
        <Link to="/">
          <img
            src="/logormv2.png"
            alt="logo 66partners"
            className="left-side__img"
            width={170}
            height={90}
            loading="lazy"
          />
        </Link>
      </section>
      <nav className="container-header__nav">
        <NavLink to="/">Accueil</NavLink>
        <NavLink to="/sports">Sports</NavLink>
        <NavLink to="/howsworking">Comment ça marche</NavLink>
        <NavLink to="/pourquoi66">Pourquoi 66Partners?</NavLink>
        <NavLink to="/FAQ">FAQ</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <Connexion
          activeModal={activeModal}
          onOpenLogin={() => setActiveModal("login")}
          onOpenRegister={() => setActiveModal("register")}
          onClose={() => setActiveModal(null)}
        />
      </nav>
      <section className="container-header__rightside">
        <Hamburger />
      </section>
    </header>
  );
}
