import "../Header/Header.scss";

import Hamburger from "../Hamburger/Hamburger";

export default function Header() {
  return (
    <>
      <header className="container-header">
        <section className="container-header__leftside">
          <img
            src="/logormbg.png"
            alt="logo 66partners"
            className="left-side__img"
            width={100}
            height={70}
            loading="lazy"
          />
        </section>
        <section className="container-header__rightside">
          <Hamburger />
        </section>
      </header>
    </>
  );
}
