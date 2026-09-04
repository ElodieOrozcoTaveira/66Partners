import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import api from "../../../lib/axios";
import { getSportVisual } from "../../../lib/sportVisuals";
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
      <div className="container-messportscard__header">
        <h2 className="container-messportscard__h2">Mes sports</h2>
        <NavLink to="/sports" className="container-messportscard__manage">
          Gérer mes sports
          <ChevronRight size={14} strokeWidth={2.4} />
        </NavLink>
      </div>

      {isLoading ? (
        <p className="container-messportscard__empty">Chargement...</p>
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
                style={{ background: `${color}1F` }}
              >
                <span className="messportscard-item__badge">
                  <Icon size={20} color={color} strokeWidth={2.2} />
                </span>
                <span className="messportscard-item__name">{sport.name}</span>
                <span className="messportscard-item__bar" style={{ background: color }} />
              </NavLink>
            );
          })}

          <NavLink to="/sports" className="messportscard-item messportscard-item--add">
            <span className="messportscard-item__badge">
              <Plus size={18} strokeWidth={2.4} />
            </span>
            <span className="messportscard-item__name">Ajouter un sport</span>
          </NavLink>
        </div>
      )}
    </div>
  );
}
