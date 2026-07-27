import './HeroFaq.scss';
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";


export default function HeroFaq() {
      const left = useRevealOnScroll<HTMLElement>();
    
    return(
        <div className="container-herofaq">
      <section
        ref={left.ref}
        className={`container-herofaq__left reveal-on-scroll${left.visible ? " is-visible" : ""}`}
      >
        <h2 className="container-herofaq__h2">FAQ</h2>
        <p className="container-herofaq__p">
           Retrouve ici les réponses aux questions les plus fréquentes sur 66Partners.
        </p>
      </section>
    </div>
    )
}