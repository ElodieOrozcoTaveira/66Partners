import './HeroSport.scss';
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";

export default function HeroSport() {
  const left = useRevealOnScroll<HTMLElement>();

  return (
    <div className="container-contactHero">
      <section
        ref={left.ref}
        className={`container-contactHero__left reveal-on-scroll${left.visible ? " is-visible" : ""}`}
      >
        <h2 className="container-contactHero__h2">Sports</h2>
        <p className="container-contactHero__p">
           Découvre toutes les activités disponibles dans les Pyrénées-Orientales proposées par 66Partners, et trouve ton partenaire.
        </p>
      </section>
    </div>
  );
}
