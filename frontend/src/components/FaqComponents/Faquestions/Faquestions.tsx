import { useState } from "react";
import { ChevronDown, HandCoins, MessageCircleQuestionMark, MessageSquareMore, Search, Shield, Star, User, UserPlus } from "lucide-react";
import "./Faquestions.scss";

export default function Faquestions() {
  const faquestions = [
    {
      id: 1,
      icone: User,
      question: "Qu'est-ce que 66Partners ?",
      reponse:
        "66Partners est une plateforme communautaire dédiée aux sportifs des Pyrénées-Orientales et aux sportifs passant leurs vacances dans notre beau département. Elle permet de trouver des partenaires, découvrir des activités et partager du sport près de chez soi.",
    },
    {
      id: 2,
      icone: UserPlus,
      question: "Comment créer un compte ?",
      reponse:
        "Clique sur 'S'inscrire' en haut à droite de l'écran, ou dans le menu burger sur téléphone mobile et tablette. Remplis les informations personnelles, valide ton email et commence à explorer la plateforme.",
    },
    {
      id: 3,
      icone: Search,
      question: "Comment trouver une activité ou un partenaire ?",
      reponse:
        "Lorsque tu es connecté sur ton profil utilisateur, tu peux rechercher un partenaire, une activité, ou une catégorie via la barre de recherche. Tu peux aussi filtrer par localisation, niveau ou type de sport pour trouver ce qui te correspond.",
    },
    {
      id: 4,
      icone: HandCoins,
      question: "Est ce que l'application est gratuite ?",
      reponse:
        "Oui, l'inscription et la plupart des fonctionnalités sont gratuites. Certaines fonctionnalités premium seront proposées prochainement.",
    },
    {
      id: 5,
      icone: Shield,
      question: "Mes données sont-elles en sécurité ?",
      reponse:
        "Absolument. Nous mettons en place des mesures de sécurité pour protéger les données personnelles. Elles ne sont jamais partagées sans ton consentement.",
    },
    {
      id: 6,
      icone: MessageSquareMore,
      question: "Comment signaler un comportement inapproprié ?",
      reponse:
        "Pour l'instant, il n'existe pas encore de bouton de signalement directement dans l'application. Utilise le formulaire de contact pour nous décrire la situation : notre équipe l'examinera rapidement.",
    },
    {
      id: 7,
      icone: Star,
      question: "Puis-je organier ma propre activité ?",
      reponse:
        "Oui! Clique sur 'Créer une activité' depuis ton espace et renseigne les informations necessaires. Les autres membres de la plateforme pourront ensuite la rejoindre.",
    },
    {
      id: 8,
      icone: MessageCircleQuestionMark,
      question: "Une autre question ?",
      reponse:
        "Si tu ne trouves pas de réponse à tes questions, notre équipe est là pour t'aider. N'hésite pas à nous contacter via le formulaire de contact.",
    },
  ];


  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="container-faquestions">
      {faquestions.map((item, index) => {
        const Icon = item.icone;
        const isOpen = openIds.has(item.id);
        const iconColorClass = index % 2 === 0 ? "faq-item__icon--rouge" : "faq-item__icon--jaune";

        return (
          <div key={item.id} className="faq-item">
            <button
              type="button"
              className="faq-item__header"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${item.id}`}
            >
              <span className={`faq-item__icon ${iconColorClass}`}>
                <Icon size={20} />
              </span>
              <h3 className="faq-item__question">{item.question}</h3>
              <ChevronDown
                className={`faq-item__chevron${isOpen ? " faq-item__chevron--open" : ""}`}
                size={18}
              />
            </button>
            <div
              id={`faq-answer-${item.id}`}
              className={`faq-item__answer${isOpen ? " faq-item__answer--open" : ""}`}
            >
              <div className="faq-item__answerInner">
                <p className="faq-item__reponse">{item.reponse}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
