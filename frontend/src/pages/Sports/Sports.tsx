import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import "./Sports.scss";

interface Sport {
  id: string;
  name: string;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

export default function Sports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SportsResponse>("/api/sports")
      .then((res) => setSports(res.data.sports))
      .catch(() => setError("Impossible de charger la liste des sports."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="sports-state">Chargement...</p>;
  if (error) return <p className="sports-state">{error}</p>;

  return (
    <div className="container-sports">
      <h1 className="container-sports__titre">Nos sports</h1>
      <ul className="container-sports__list">
        {sports.map((sport) => {
          const { icon: Icon, color } = getSportVisual(sport.name);
          return (
            <li key={sport.id} className="sport-card">
              <span className="sport-card__circle" style={{ backgroundColor: color }}>
                <Icon color={getIconColor(color)} size={20} />
              </span>
              <span>{sport.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
