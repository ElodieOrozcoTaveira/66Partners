import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useTerritory } from "../../../contexts/TerritoryContext";
import "./Bonjour.scss";
import { useBranding } from "../../../contexts/TerritoryContext";

type BonjourProps = {
  onNavigate?: () => void;
};

export default function Bonjour({ onNavigate }: BonjourProps) {
  const { asset } = useBranding();
  const { user } = useAuth();
  const { selectableTerritories, activeTerritory, setActiveTerritory } = useTerritory();
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
            src={user?.avatar || asset("avatarDefault")}
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
            {/* Territoire actif (contexte d'utilisation), même sélecteur que le Header. */}
            {user && activeTerritory && (
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
                  {selectableTerritories.map((territory) => (
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
