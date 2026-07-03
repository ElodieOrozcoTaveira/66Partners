export default function Header() {
  return (
    <>
      <div className="containe-header">
        <section className="container-header__leftside">
          <img
            src="/logo.png"
            alt="logo 66partners"
            className="left-side__img"
            width={250}
            height={200}
            loading="lazy"
          />
        </section>
        <section className="container-header__rightside"></section>
      </div>
    </>
  );
}
