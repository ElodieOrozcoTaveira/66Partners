import { Handshake, MapPin, Star, Trophy } from "lucide-react";
import "./Experience.scss";

const ROUGE = "#E6392E";
const JAUNE = "#F4A61D";

export default function Experience() {
  const exp = [
    {
      id: 1,
      icone: MapPin,
      titre: "100% local",
      description: "Activités près de chez toi.",
      iconeColor: ROUGE,
    },
    {
      id: 2,
      icone: Trophy,
      titre: "Communauté",
      description: "Active et bienveillante.",
      iconeColor: JAUNE,
    },
    {
      id: 3,
      icone: Handshake,
      titre: "Confiance",
      description: "Des sportifs vérifiés.",
      iconeColor: ROUGE,
    },
    {
      id: 4,
      icone: Star,
      titre: "Partage",
      description: "Rencontres et dépassement.",
      iconeColor: JAUNE,
    },
  ];

  return (
    <>
      <h3 className="container-experience__h3">
        Une experience 100% locale et conviviale
      </h3>
      <div className="container-experience">
        {exp.map((experience) => {
          const Icon = experience.icone;

          return (
            <>
              <div key={experience.id} className="container-experience__item">
                <Icon size={30} color={experience.iconeColor} className="container-experience__icon" />
                <div className="container-experience__titre">
                  {experience.titre}
                </div>
                <div className="container-experience__description">
                  {experience.description}
                </div>
              </div>
            </>
          );
        })}
      </div>
    </>
  );
}
