import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { Calendar, Users } from "lucide-react";
import api from "../../lib/axios";
import { getIconColor, getSportVisual } from "../../lib/sportVisuals";
import { getSportPhoto } from "../../lib/sportPhotos";
import "./Sports.scss";
import HeroSport from "../../components/SportsComponents/HeroSport/HeroSport";
import Recherche from "../../components/SportsComponents/Recherche/Recheche";
import ContactSport from "../../components/SportsComponents/ContactSport/ContactSport";

const DEFAULT_PHOTO = "/montagne.png";

function handlePhotoError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PHOTO;
}

interface Sport {
  id: string;
  name: string;
  activitiesCount: number;
  participantsCount: number;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

export default function Sports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<SportsResponse>("/api/sports")
      .then((res) => setSports(res.data.sports))
      .catch(() => setError("Impossible de charger la liste des sports."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredSports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sports;
    return sports.filter((sport) => sport.name.toLowerCase().includes(normalizedQuery));
  }, [sports, query]);

  if (isLoading) return <p className="sports-state">Chargement...</p>;
  if (error) return <p className="sports-state">{error}</p>;

  return (
    <>
    <HeroSport/>
      <Recherche value={query} onChange={setQuery} />
    <div className="container-sports">
      {filteredSports.length === 0 ? (
        <p className="sports-state">Aucun sport ne correspond à ta recherche.</p>
      ) : (
        <ul className="container-sports__list">
          {filteredSports.map((sport) => {
            const { icon: Icon, color } = getSportVisual(sport.name);
            return (
              <li key={sport.id} className="sport-card">
                <div className="sport-card__thumb">
                  <img
                    src={getSportPhoto(sport.name)}
                    alt={sport.name}
                    className="sport-card__photo"
                    onError={handlePhotoError}
                  />
                  <span className="sport-card__badge" style={{ backgroundColor: color }}>
                    <Icon color={getIconColor(color)} size={16} />
                  </span>
                </div>

                <h3 className="sport-card__name">{sport.name}</h3>

                <div className="sport-card__stats">
                  <span className="sport-card__stat">
                    <Calendar size={13} />
                    {sport.activitiesCount} sortie{sport.activitiesCount === 1 ? "" : "s"}
                  </span>
                  <span className="sport-card__stat">
                    <Users size={13} />
                    {sport.participantsCount} participant{sport.participantsCount === 1 ? "" : "s"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    <ContactSport/>
    </>
  );
}
