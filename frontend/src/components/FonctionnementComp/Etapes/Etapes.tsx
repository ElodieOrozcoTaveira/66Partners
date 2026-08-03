import { MessageCircle, Search, UserPlus, Users } from 'lucide-react';
import './Etapes.scss';

const PEACH = '#FDECD1';
const ROUGE = '#E6392E';
const JAUNE = '#F4A61D';
const NUIT = '#1F2937';

export default function Etapes() {
  const etapes = [
    {
      id: 1,
      numero: 1,
      icone: UserPlus,
      circleColor: PEACH,
      iconColor: NUIT,
      badgeColor: JAUNE,
      titre: 'Crée ton compte',
      description: "Inscris-toi en quelques secondes et complète ton profil sportif.",
    },
    {
      id: 2,
      numero: 2,
      icone: Search,
      circleColor: ROUGE,
      iconColor: 'white',
      badgeColor: ROUGE,
      titre: 'Trouve une activité',
      description:
        'Recherche ou filtre les activités qui te correspondent : sport, lieu, date, niveau...',
    },
    {
      id: 3,
      numero: 3,
      icone: Users,
      circleColor: JAUNE,
      iconColor: 'white',
      badgeColor: JAUNE,
      titre: 'Rejoins et participe',
      description: 'Demande à rejoindre et échange avec les autres participants.',
    },
    {
      id: 4,
      numero: 4,
      icone: MessageCircle,
      circleColor: ROUGE,
      iconColor: 'white',
      badgeColor: ROUGE,
      titre: 'Partage ta passion',
      description: 'Profite, progresse et crée des liens autour du sport !',
    },
  ];

  return (
    <div className="container-etapes">
      {etapes.map((etape) => {
        const Icon = etape.icone;

        return (
          <div key={etape.id} className="etape">
            <div className="etape__marker">
              <span className="etape__circle" style={{ backgroundColor: etape.circleColor }}>
                <Icon color={etape.iconColor} size={26} />
              </span>
              <span className="etape__badge" style={{ backgroundColor: etape.badgeColor }}>
                {etape.numero}
              </span>
              <span className="etape__line" />
            </div>
            <div className="etape__card">
              <h3 className="etape__titre">{etape.titre}</h3>
              <p className="etape__p">{etape.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
