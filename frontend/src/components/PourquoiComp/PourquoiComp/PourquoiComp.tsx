import "./PourquoiComp.scss";
import { useRevealOnScroll } from "../../../hooks/useRevealOnScroll";

export default function PourquoiComp() {
  const left = useRevealOnScroll<HTMLElement>();

  return (
    <>
      <div className="container-pourquoicomp">
        <section
          ref={left.ref}
          className={`container-pourquoicomp__left reveal-on-scroll${left.visible ? " is-visible" : ""}`}
        >
          <h2 className="container-pourquoicomp__h2">Pourquoi 66Partners?</h2>
          <p className="container-pourquoicomp__p">
            Une plateforme pensée pour les passionnés de sport et d'activités
            outdoor et indoor. Rejoindre 66Partners, c'est faire partie d'une
            communauté engagée, bienveillante et active.
          </p>
        </section>
        
      </div>
    </>
  );
}
