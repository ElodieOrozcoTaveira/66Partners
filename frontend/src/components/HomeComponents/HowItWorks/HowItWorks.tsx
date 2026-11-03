import { NavLink } from "react-router-dom";
import { ArrowRight, CalendarPlus, UserRound, UsersRound } from "lucide-react";
import { useBranding } from "../../../contexts/TerritoryContext";
import "./HowItWorks.scss";

const STEPS = [
  {
    icon: UserRound,
    titre: "Inscris-toi",
    texte: "Crée ton compte en quelques secondes, choisis ton territoire et tes sports favoris.",
  },
  {
    icon: CalendarPlus,
    titre: "Crée ou rejoins",
    texte: "Propose ta sortie (sport, lieu, date, niveau) ou envoie une demande pour en rejoindre une.",
  },
  {
    icon: UsersRound,
    titre: "Retrouvez-vous",
    texte: "Discussion de groupe, rappels la veille et une heure avant : il ne reste qu'à bouger ensemble.",
  },
];

/** « Comment ça marche » : sur l'emblème du territoire, teinté à ses couleurs. */
export default function HowItWorks() {
  const { asset } = useBranding();
  return (
    <section className="how page-container" aria-labelledby="how-titre">
      <div className="how__inner" style={{ backgroundImage: `url(${asset("emblem")})` }}>
        <div className="how__tint" />
        <div className="how__content">
          <span className="eyebrow eyebrow--light eyebrow--center">Comment ça marche</span>
          <h2 id="how-titre" className="how__titre">Inscris-toi, choisis, bouge.</h2>
          <ol className="how__steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.titre} className="how__step">
                  <div className="how__step-head">
                    <span className="how__icon">
                      <Icon size={22} />
                    </span>
                    <span className="how__num">{index + 1}</span>
                  </div>
                  <h3>{step.titre}</h3>
                  <p>{step.texte}</p>
                </li>
              );
            })}
          </ol>
          <NavLink to="/fonctionnement" className="btn btn--accent how__link">
            En savoir plus <ArrowRight size={16} />
          </NavLink>
        </div>
      </div>
    </section>
  );
}
