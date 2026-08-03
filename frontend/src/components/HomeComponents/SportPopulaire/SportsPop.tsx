import { useEffect, useState, type SyntheticEvent } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
import "./SportsPop.scss";

const DEFAULT_PHOTO = "/montagne.webp";
const RANDOM_COUNT = 6;

function handlePhotoError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PHOTO;
}

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface Sport {
  id: string;
  name: string;
  favoritesCount: number;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

export default function SportsPop() {
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    api
      .get<SportsResponse>("/api/sports")
      .then((res) => setSports(pickRandom(res.data.sports, RANDOM_COUNT)))
      .catch(() => setSports([]));
  }, []);

  return (
    <div className="container-sportpop">
      <div className="container-sportpop__header">
        <h2 className="container-sportpop__h2">Sports populaires</h2>
        <NavLink to="/sports" className="container-sportpop__btn">
          Voir tout
        </NavLink>
      </div>

      <div className="container-sportpop__list">
        {sports.map((sport) => {
          const { icon: Icon, color } = getSportVisual(sport.name);

          return (
            <NavLink key={sport.id} to="/sports" className="sportpop-item">
              <div className="sportpop-item__thumb">
                <img
                  src={getSportPhoto(sport.name)}
                  alt={sport.name}
                  className="sportpop-item__photo"
                  onError={handlePhotoError}
                />
                <span
                  className="sportpop-item__badge"
                  style={{ backgroundColor: color }}
                >
                  <Icon color={getIconColor(color)} size={14} />
                </span>
              </div>
              <span className="sportpop-item__name">{sport.name}</span>
              <span className="sportpop-item__membres">
                {sport.favoritesCount} membre{sport.favoritesCount === 1 ? "" : "s"}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
