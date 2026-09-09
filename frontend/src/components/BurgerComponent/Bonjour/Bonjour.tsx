import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useTerritory } from "../../../contexts/TerritoryContext";
import "./Bonjour.scss";

type BonjourProps = {
  onNavigate?: () => void;
};

export default function Bonjour({ onNavigate }: BonjourProps) {
  const { user } = useAuth();
  const { territories, activeTerritory, setActiveTerritory } = useTerritory();
  const navigate = useNavigate();

  // Le chiffre du territoire ne doit jamais déclencher la navigation vers le
  // profil portée par toute la carte : on stoppe la propagation avant qu'elle
  // n'atteigne le onClick/onKeyDown du conteneur.
  function stopBubble<T extends { stopPropagation: () => void }>(event: T) {
    event.stopPropagation();
  }

  const handleGoToProfile = () => {
    onNavigate?.();
    navigate("/profile");
  };

  return (
    <>
      <div
        className={`container-bonjour ${user ? "container-bonjour--clickable" : ""}`}
        onClick={user ? handleGoToProfile : undefined}
        role={user ? "button" : undefined}
        tabIndex={user ? 0 : undefined}
        onKeyDown={(e) => {
          if (!user) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleGoToProfile();
          }
        }}
      >
        <section className="container-bonjour__leftside">
          <img
            src={user?.avatar || "/avatardefault.webp"}
            alt={
              user ? `Photo de profil de ${user.pseudo}` : "logo de montagne"
            }
            height={70}
            width={70}
            className="container-bonjour__img"
          />
        </section>
        <section className="container-bonjour__rightside">
          <div className="container-bonjour__nameRow">
            <h3 className="container-bonjour__h3">
              {user ? user.pseudo : "Bonjour !👋"}
            </h3>
            {/* Invisible tant qu'un utilisateur n'appartient qu'à un seul
                territoire (le cas de tous les comptes en V1) — même règle
                que le sélecteur du Header, jamais de badge statique pour un
                compte mono-territoire. */}
            {user && activeTerritory && territories.length > 1 && (
              <span
                className="container-bonjour__territoryTab"
                onClick={stopBubble}
                onKeyDown={stopBubble}
              >
                <select
                  aria-label="Territoire actif"
                  value={activeTerritory.code}
                  onChange={(e) => setActiveTerritory(e.target.value)}
                  onClick={stopBubble}
                >
                  {territories.map((territory) => (
                    <option key={territory.id} value={territory.code}>
                      {territory.code}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </div>
          <p className="container-bonjour__p">
            {user ? "Voir mon profil" : "Prêt pour de nouvelles aventures ?"}
          </p>
        </section>
        {user && (
          <ChevronRight className="container-bonjour__chevron" size={20} strokeWidth={2.4} />
        )}
      </div>
    </>
  );
}
