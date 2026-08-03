import { useState } from "react";
import { ArrowRight, Calendar, MapPin, ShieldCheck, Users } from "lucide-react";
import "./Cases.scss";
import ModaleContent from "../../ModaleConnexion/ModaleContent/ModaleContent";
import ModaleRegisterContent from "../../ModaleRegister/ModaleRegisteContent/ModaleRegisterContent";

const JAUNE = "#F4A61D";
const ROUGE = "#E6392E";
const JAUNE_CLAIR = "#FDECD1";
const ROUGE_CLAIR = "#FBE0DD";

export default function Cases() {
  const cases = [
    {
      id: 1,
      logo: Users,
      color: JAUNE,
      circleColor: JAUNE_CLAIR,
      titre: "Une communauté active",
      paragraphe:
        "Rencontrez des passionés, partagez vos expériences et participez à des évenements près de chez vous.",
    },
    {
      id: 2,
      logo: ShieldCheck,
      color: ROUGE,
      circleColor: ROUGE_CLAIR,
      titre: "Sécurité et Confiance",
      paragraphe:
        "Des profils vérifiés, une modération active et des échanges en tout sérénité.",
    },
    {
      id: 3,
      logo: MapPin,
      color: JAUNE,
      circleColor: JAUNE_CLAIR,
      titre: "Des activité pour tous",
      paragraphe:
        "Trouvez ou proposez des activités adaptées à tous les niveaux et à toutes les envies.",
    },
    {
      id: 4,
      logo: Calendar,
      color: ROUGE,
      circleColor: ROUGE_CLAIR,
      titre: "Organisation simplifiée",
      paragraphe:
        "Gérez vos sorties et évènements facilement grâce à des outils pensés pour vous.",
    },
  ];
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null);

  return (
    <>
      <div className="container-cases__grid">
        {cases.map((item) => {
          const Icon = item.logo;

          return (
            <div key={item.id} className="container-cases">
              <span className="container-cases__circle" style={{ backgroundColor: item.circleColor }}>
                <Icon className="container-cases__img" color={item.color} size={28} />
              </span>
              <section className="container-cases__section">
                <h2 className="container-cases__h2">{item.titre}</h2>
                <p className="container-cases__p">{item.paragraphe}</p>
              </section>
            </div>
          );
        })}
      </div>

      <div className="container-cases__rejoindre">
        <h3 className="container-cases__h3">Prêt à vivre l'aventure avec nous?</h3>
        <button
          type="button"
          className="container-cases__link"
          onClick={() => setActiveModal("register")}
        >
          Rejoignez la communauté <ArrowRight size={12} color="#ff4500" />
        </button>
      </div>

      <ModaleContent
        isOpen={activeModal === "login"}
        onClose={() => setActiveModal(null)}
        onSwitchToRegister={() => setActiveModal("register")}
      />
      <ModaleRegisterContent
        isOpen={activeModal === "register"}
        onClose={() => setActiveModal(null)}
        onSwitchToLogin={() => setActiveModal("login")}
      />
    </>
  );
}
