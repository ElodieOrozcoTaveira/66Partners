import {
  Calendar,
  CalendarPlus,
  Locate,
  MapPin,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from "lucide-react";
import "./PourquoiHome.scss";

const ROUGE = "#E6392E";
export default function PourquoiHome() {
  const choix = [
    {
      id: 1,
      icone: UsersRound,
      titre: "Communauté locale",
      description: "Rejoins une communauté de sportifs passionés dans le 66.",
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
      titre: "Découvre le 66",
      description:
        "Explore les plus beaux spots sportifs des Pyrénées-Orientales.",
    },
    {
      id: 5,
      icone: Sparkles,
      titre: "Gratuit & Accessible",
      description:
        "L'inscription est gratuite et toutes les fonctionnalités de base aussi !.",
    },
  ];
  return (
    <>
      <div className="container-pourquoiHome">
        <div className="container-pourquoiHome__header">
          <h2 className="container-pourquoiHome__h2">
            Pourquoi choisir 66Partners?{" "}
          </h2>
        </div>
      </div>
      <div className="container-choice__grid">
        {choix.map((choice) => {
          const Icon = choice.icone;

          return (
            <div key={choice.id} className="choice-item">
              <div className="choice-item__header">
                <Icon color={ROUGE} size={40} />

                <h3 className="choice-item__titre">{choice.titre}</h3>
              </div>
              <p className="choice-item__p">{choice.description}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
