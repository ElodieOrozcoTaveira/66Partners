import type { ReactNode } from "react";
import { useBranding } from "../../contexts/TerritoryContext";
import "./PageHero.scss";

interface PageHeroProps {
  /** Sur-titre (style 66Partners, au-dessus du titre). */
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  /** Niveau du titre : h1 par défaut, h2 si la page a déjà un h1. */
  as?: "h1" | "h2";
  /** Contenu sous le texte (boutons…). */
  children?: ReactNode;
}

/**
 * En-tête commun des pages secondaires (Sports, FAQ, Contact, Comment ça
 * marche, Pourquoi…) : couverture du territoire arrondie, teintée à ses
 * couleurs, titre en blanc (même famille que la photo de l'accueil).
 */
export default function PageHero({ eyebrow, title, text, as = "h1", children }: PageHeroProps) {
  const { asset } = useBranding();
  const Heading = as;
  return (
    <section className="page-hero page-container">
      <img className="page-hero__bg" src={asset("hero")} alt="" />
      <div className="page-hero__overlay" />
      <div className="page-hero__content">
        {eyebrow ? <span className="eyebrow eyebrow--light">{eyebrow}</span> : null}
        <Heading className="page-hero__title">{title}</Heading>
        {text ? <p className="page-hero__text">{text}</p> : null}
        {children}
      </div>
    </section>
  );
}
