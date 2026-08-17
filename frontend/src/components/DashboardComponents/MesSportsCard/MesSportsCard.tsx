import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import "./MesSportsCard.scss";

interface Sport {
  id: string;
  name: string;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

interface FavoritesResponse {
  success: boolean;
  sportIds: string[];
}

interface MesSportsCardProps {
  userId: string;
}

export default function MesSportsCard({ userId }: MesSportsCardProps) {
  const [favoriteSports, setFavoriteSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get<SportsResponse>("/api/sports"),
      api.get<FavoritesResponse>("/api/sports/favorites/mine"),
    ])
      .then(([sportsRes, favoritesRes]) => {
        if (!mounted) return;
        const favoriteIds = new Set(favoritesRes.data.sportIds);
        setFavoriteSports(
          sportsRes.data.sports.filter((sport) => favoriteIds.has(sport.id)),
        );
      })
      .catch(() => {
        if (mounted) setFavoriteSports([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <div className="container-messportscard">
      <h2 className="container-messportscard__h2">Mes sports</h2>

      {isLoading ? (
        <p className="container-messportscard__empty">Chargement...</p>
      ) : favoriteSports.length === 0 ? (
        <p className="container-messportscard__empty">
          Ajoute des sports favoris depuis la page Sports.
        </p>
      ) : (
        <div className="container-messportscard__list">
          {favoriteSports.map((sport) => {
            const { icon: Icon, color } = getSportVisual(sport.name);
            return (
              <NavLink
                key={sport.id}
                to="/sports"
                className="messportscard-item"
                title={sport.name}
              >
                <span
                  className="messportscard-item__badge"
                  style={{ backgroundColor: color }}
                >
                  <Icon color={getIconColor(color)} size={16} />
                </span>
                <span className="messportscard-item__name">{sport.name}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
