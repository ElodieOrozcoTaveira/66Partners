import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { ArrowRight, Heart, Plus } from "lucide-react";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
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
  /** Activités à venir du territoire (déjà chargées par Dashboard.tsx). */
  upcomingActivities?: { sportId?: string; status: string }[];
}

export default function MesSportsCard({ userId, upcomingActivities = [] }: MesSportsCardProps) {
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

  // Sorties à venir par sport (hors annulées).
  const upcomingBySport = useMemo(() => {
    const counts = new Map<string, number>();
    upcomingActivities.forEach((activity) => {
      if (!activity.sportId || activity.status === "CANCELLED") return;
      counts.set(activity.sportId, (counts.get(activity.sportId) ?? 0) + 1);
    });
    return counts;
  }, [upcomingActivities]);

  return (
    <section className="dash-section" aria-labelledby="dash-mes-sports">
      <div className="dash-section__head">
        <h2 id="dash-mes-sports" className="dash-section__title">Mes sports</h2>
        <NavLink to="/sports" className="dash-section__link">
          Gérer <ArrowRight size={15} />
        </NavLink>
      </div>

      {isLoading ? (
        <div className="messports-row" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <span key={key} className="messports-card messports-card--skeleton" />
          ))}
        </div>
      ) : favoriteSports.length === 0 ? (
        <div className="messports-empty">
          <span className="messports-empty__icon">
            <Heart size={20} />
          </span>
          <div>
            <p className="messports-empty__title">Choisis tes sports favoris</p>
            <p className="messports-empty__text">
              On te montrera ici les sorties à venir dans chacun d'eux.
            </p>
          </div>
          <NavLink to="/sports" className="btn btn--primary messports-empty__cta">
            <Plus size={17} /> Ajouter
          </NavLink>
        </div>
      ) : (
        <div className="messports-row">
          {favoriteSports.map((sport) => {
            const { icon: Icon, color } = getSportVisual(sport.name);
            const count = upcomingBySport.get(sport.id) ?? 0;
            return (
              <NavLink
                key={sport.id}
                to={`/explorer?sport=${sport.id}`}
                className="messports-card"
                aria-label={`${sport.name} : ${count} sortie${count > 1 ? "s" : ""} à venir`}
              >
                <span className="messports-card__photo">
                  <img src={getSportPhoto(sport.name)} alt="" loading="lazy" />
                  <span className="messports-card__badge" style={{ backgroundColor: color }}>
                    <Icon size={12} color={getIconColor(color)} strokeWidth={2.4} />
                  </span>
                </span>
                <span className="messports-card__text">
                  <span className="messports-card__name">{sport.name}</span>
                  <span className={`messports-card__count${count === 0 ? " is-zero" : ""}`}>
                    {count === 0
                      ? "Pas de sortie prévue"
                      : `${count} sortie${count > 1 ? "s" : ""} à venir`}
                  </span>
                </span>
                <ArrowRight className="messports-card__go" size={16} />
              </NavLink>
            );
          })}

          <NavLink to="/sports" className="messports-card messports-card--add">
            <span className="messports-card__plus">
              <Plus size={18} strokeWidth={2.4} />
            </span>
            <span className="messports-card__name">Ajouter un sport</span>
          </NavLink>
        </div>
      )}
    </section>
  );
}
