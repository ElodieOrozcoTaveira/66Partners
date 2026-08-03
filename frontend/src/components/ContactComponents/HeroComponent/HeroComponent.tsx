import './HeroComponent.scss';
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";

export default function HeroComponent() {
  const left = useRevealOnScroll<HTMLElement>();

  return (
    <div className="container-contactHero">
      <section
        ref={left.ref}
        className={`container-contactHero__left reveal-on-scroll${left.visible ? " is-visible" : ""}`}
      >
        <h2 className="container-contactHero__h2">Contact</h2>
        <p className="container-contactHero__p">
           Une question, une suggestion ou besoin d'aide? Notre équipe est là
        pour vous accompagner. N'hésitez pas à nous contacter, nous répondrons
        dans les plus brefs délais.
        </p>
      </section>
    </div>
  );
}
