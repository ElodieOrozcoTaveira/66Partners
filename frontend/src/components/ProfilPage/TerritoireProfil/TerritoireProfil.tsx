import { useState } from "react";
import { MapPin } from "lucide-react";
import { isAxiosError } from "axios";
import { useTerritory } from "../../../contexts/TerritoryContext";
import "./TerritoireProfil.scss";

export default function TerritoireProfil() {
  const {
    territories,
    activeTerritory,
    joinableTerritories,
    setActiveTerritory,
    joinTerritory,
  } = useTerritory();
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!activeTerritory) return null;

  async function handleJoin(code: string) {
    setError(null);
    setJoiningCode(code);
    try {
      await joinTerritory(code);
      setActiveTerritory(code);
    } catch (err) {
      setError(
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de rejoindre ce territoire.",
      );
    } finally {
      setJoiningCode(null);
    }
  }

  return (
    <section className="container-territoire">
      <h3 className="container-territoire__titre">
        <MapPin size={16} /> Mon territoire
      </h3>
      <p className="container-territoire__actif">
        Territoire actif : <strong>{activeTerritory.brandName}</strong> — {activeTerritory.name}
      </p>

      {territories.length > 1 && (
        <div className="container-territoire__liste" role="group" aria-label="Changer de territoire">
          {territories.map((territory) => (
            <button
              key={territory.id}
              type="button"
              className={`container-territoire__choix${
                territory.code === activeTerritory.code ? " container-territoire__choix--actif" : ""
              }`}
              aria-pressed={territory.code === activeTerritory.code}
              onClick={() => setActiveTerritory(territory.code)}
            >
              {territory.brandName}
            </button>
          ))}
        </div>
      )}

      {joinableTerritories.length > 0 && (
        <div className="container-territoire__rejoindre">
          <p className="container-territoire__aide">
            Tu peux aussi rejoindre un autre territoire. Tes activités et tes données restent
            attachées à chaque territoire.
          </p>
          {joinableTerritories.map((territory) => (
            <button
              key={territory.id}
              type="button"
              className="container-territoire__rejoindre-btn"
              disabled={joiningCode !== null}
              onClick={() => handleJoin(territory.code)}
            >
              {joiningCode === territory.code
                ? "Ajout en cours…"
                : `Rejoindre ${territory.brandName} (${territory.name})`}
            </button>
          ))}
        </div>
      )}

      {error && <p className="container-territoire__erreur">{error}</p>}
    </section>
  );
}
