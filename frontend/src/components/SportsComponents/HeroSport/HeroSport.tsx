import './HeroSport.scss';
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";

export default function HeroSport() {
  const left = useRevealOnScroll<HTMLElement>();

  return (
    <div className="container-contactSport">
      <section
        ref={left.ref}
        className={`container-contactSport__left reveal-on-scroll${left.visible ? " is-visible" : ""}`}
      >
        <h2 className="container-contactSport__h2">Sports</h2>
        <p className="container-contactSport__p">
           Découvre toutes les activités disponibles dans les Pyrénées-Orientales proposées par 66Partners, et trouve ton partenaire.
        </p>
      </section>
    </div>
  );
}
