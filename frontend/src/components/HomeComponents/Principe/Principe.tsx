import { Calendar, User, Users } from "lucide-react";
import "./Principe.scss";

export default function Principe() {
  const principes = [
    {
      id: 1,
      numero: 1,
      icone: User,
      titre: "Inscris toi",
      description:
        "Crée ton compte en quelques secondes et rejoins la communauté.",
    },
    {
      id: 2,
      numero: 2,
      icone: Calendar,
      titre: "Crée ton activité",
      description:
        "Choisis ton sport, ton lieu, la date et le niveau souhaité. C'est parti !",
    },
    {
      id: 3,
      numero: 3,
      icone: Users,
      titre: "Trouve tes partenaires",
      description:
        "Des sportifs près de chez toi rejoignent ton activité. A vous de jouer !",
    },
  ];

  return (
    <div className="container-principe">
      <h2 className="container-principe__h2">Le principe</h2>
      <p className="container-principe__p">
        Inscris-toi, crée ton activité et trouve tes partenaires !
      </p>

      <div className="container-principe__grid">
        {principes.map((principe) => {
          const Icon = principe.icone;

          return (
            <div key={principe.id} className="principe-item">
              <div className="principe-item__header">
                <span className="principe-item__circle">
                  <Icon color="white" size={26} />
                  <span className="principe-item__badge">{principe.numero}</span>
                </span>
                <h3 className="principe-item__titre">{principe.titre}</h3>
              </div>
              <p className="principe-item__p">{principe.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
