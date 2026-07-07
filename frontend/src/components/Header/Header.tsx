import "../Header/Header.scss";
import Hamburger from "../Hamburger/Hamburger";

export default function Header() {
  return (
    <header className="container-header">
      <section className="container-header__leftside">
        <img
          src="/logo66remove.png"
          alt="logo 66partners"
          className="left-side__img"
          width={90}
          height={70}
          loading="lazy"
        />
      </section>
      <section className="container-header__rightside">
        <Hamburger />
      </section>
    </header>
  );
}
