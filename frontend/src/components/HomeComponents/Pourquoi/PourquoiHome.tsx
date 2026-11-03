import {
  CalendarPlus,
  MapPin,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from "lucide-react";
import "./PourquoiHome.scss";
import { useBranding } from "../../../contexts/TerritoryContext";

const ROUGE = "var(--brand-primary, #C4121A)";

export default function PourquoiHome() {
  const { brandName, territoryOf, inseeDepartmentCode } = useBranding();
  const choix = [
    {
      id: 1,
      icone: UsersRound,
      titre: "Communauté locale",
      description: `Rejoins une communauté de sportifs passionnés dans le ${inseeDepartmentCode}.`,
    },
    {
      id: 2,
      icone: ShieldAlert,
      titre: "Sécurité & Bienveillance",
      description:
        "Un environnement respectueux et sécurisé pour tous les niveaux.",
    },
    {
      id: 3,
      icone: CalendarPlus,
      titre: "Activités Flexibles",
      description: "Crée ou rejoins des sorties quand tu veux, comme tu veux.",
    },
    {
      id: 4,
      icone: MapPin,
      titre: `Découvre le ${inseeDepartmentCode}`,
      description:
        `Explore les plus beaux spots sportifs ${territoryOf}.`,
    },
    {
      id: 5,
      icone: Sparkles,
      titre: "Gratuit & Accessible",
      description:
        "L'inscription est gratuite et toutes les fonctionnalités de base aussi !",
    },
  ];

  return (
    <section className="pourquoi page-container" aria-labelledby="pourquoi-titre">
      <div className="pourquoi__head">
        <span className="eyebrow eyebrow--center">Pourquoi {brandName}</span>
        <h2 id="pourquoi-titre" className="pourquoi__titre">
          Une communauté locale,
          <br />
          bienveillante et gratuite.
        </h2>
        <p className="pourquoi__p">Tout ce qu'il faut pour pratiquer ton sport en toute confiance.</p>
      </div>

      <div className="pourquoi__grid">
        {choix.map((choice) => {
          const Icon = choice.icone;

          return (
            <article key={choice.id} className="pourquoi__card">
              <span className="pourquoi__icon">
                <Icon color={ROUGE} size={22} />
              </span>
              <h3>{choice.titre}</h3>
              <p>{choice.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
