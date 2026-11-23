import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./OseCreer.scss";

const DOUTES = [
  {
    doute: "Et si personne ne s'inscrit ?",
    reponse: "Tu fais ta séance quand même, et tu retentes une prochaine fois.",
  },
  {
    doute: "Je n'ai pas le niveau…",
    reponse: "Tu indiques le tien : ceux qui viendront sauront à quoi s'attendre. Et au pire, c'est pas grave : tu ne peux que progresser..",
  },
  {
    doute: "Je ne connais personne.",
    reponse: "C'est justement le meilleur moment pour proposer une sortie.",
  },
  {
    doute: "Et si je change d'avis ?",
    reponse: "Tu peux supprimer ton activité. Aucune pression.",
  },
];

/** Incite à proposer sa propre activité en dédramatisant le risque d'un « flop ». */
export default function OseCreer({ onRequireAccount }: { onRequireAccount: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => (user ? navigate("/mesactivités/nouvelle") : onRequireAccount());

  return (
    <section className="ose-creer page-container" aria-labelledby="ose-creer-titre">
      <div className="ose-creer__card">
        <div className="ose-creer__text">
          <span className="ose-creer__eyebrow">
            <Sparkles size={24} strokeWidth={2.4} /> Ose te lancer
          </span>
          <h2 id="ose-creer-titre" className="ose-creer__titre">
            Une idée de sortie&nbsp;?
            <span>Crée ton activité&nbsp;!</span>
          </h2>
          <p>
            Une rando, un footing, un padel : propose ce qui te fait envie et d'autres
            sportifs pourront te rejoindre. Et si personne ne vient ? Pas grave : tu
            profites de ta séance et, au moins, t'auras essayé.
          </p>
          <button type="button" className="btn btn--accent" onClick={handleClick}>
            {user ? "Créer mon activité" : "Créer mon compte et me lancer"}
            <ArrowRight size={17} />
          </button>
        </div>

        <ul className="ose-creer__doutes">
          {DOUTES.map(({ doute, reponse }) => (
            <li key={doute} className="ose-creer__doute">
              <strong>{doute}</strong>
              <span>{reponse}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
