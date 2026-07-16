import { Link } from "react-router-dom";
import "../Header/Header.scss";
import Hamburger from "../BurgerComponent/Hamburger/Hamburger";

export default function Header() {
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
      <section className="container-header__rightside">
        <Hamburger />
      </section>
    </header>
  );
}
