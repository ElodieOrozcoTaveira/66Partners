import './FH.scss'; 
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";


export default function FH() {
      const left = useRevealOnScroll<HTMLElement>();
    
    return(
        <div className="container-fh">
      <section
        ref={left.ref}
        className={`container-fh__left reveal-on-scroll${left.visible ? " is-visible" : ""}`}
      >
        <h2 className="container-fh__h2">Comment ça marche?</h2>
        <p className="container-fh__p">
           Rejoins la communauté 66Partners et profite d'activités sportives près de chez toi en quelques étapes!
        </p>
      </section>
    </div>
    )
}