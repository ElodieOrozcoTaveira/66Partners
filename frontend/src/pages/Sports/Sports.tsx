import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { Calendar, Heart, Users } from "lucide-react";
import api from "../../lib/axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  getIconColor,
  getSportShadow,
  getSportVisual,
} from "../../lib/sportVisuals";
import { getSportPhoto } from "../../lib/sportPhotos";
import ModaleContent from "../../components/ModaleConnexion/ModaleContent/ModaleContent";
import ModaleRegisterContent from "../../components/ModaleRegister/ModaleRegisteContent/ModaleRegisterContent";
import "./Sports.scss";
import HeroSport from "../../components/SportsComponents/HeroSport/HeroSport";
import Recherche from "../../components/SportsComponents/Recherche/Recheche";
import ContactSport from "../../components/SportsComponents/ContactSport/ContactSport";

const DEFAULT_PHOTO = "/montagne.webp";

function handlePhotoError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PHOTO;
}

interface Sport {
  id: string;
  name: string;
  activitiesCount: number;
  participantsCount: number;
  favoritesCount: number;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

interface FavoritesResponse {
  success: boolean;
  sportIds: string[];
}

export default function Sports() {
  const { user } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );

  useEffect(() => {
    api
      .get<SportsResponse>("/api/sports")
      .then((res) => setSports(res.data.sports))
      .catch(() => setError("Impossible de charger la liste des sports."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    api
      .get<FavoritesResponse>("/api/sports/favorites/mine")
      .then((res) => setFavoriteIds(new Set(res.data.sportIds)))
      .catch(() => setFavoriteIds(new Set()));
  }, [user]);

  function handleToggleFavorite(sportId: string) {
    if (!user) {
      setActiveModal("login");
      return;
    }

    const wasFavorited = favoriteIds.has(sportId);

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(sportId);
      } else {
        next.add(sportId);
      }
      return next;
    });
    setSports((prev) =>
      prev.map((sport) =>
        sport.id === sportId
          ? {
              ...sport,
              favoritesCount: sport.favoritesCount + (wasFavorited ? -1 : 1),
            }
          : sport,
      ),
    );

    api.post(`/api/sports/${sportId}/favorite`).catch(() => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(sportId);
        } else {
          next.delete(sportId);
        }
        return next;
      });
      setSports((prev) =>
        prev.map((sport) =>
          sport.id === sportId
            ? {
                ...sport,
                favoritesCount: sport.favoritesCount + (wasFavorited ? 1 : -1),
              }
            : sport,
        ),
      );
    });
  }

  const filteredSports = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sports;
    return sports.filter((sport) =>
      sport.name.toLowerCase().includes(normalizedQuery),
    );
  }, [sports, query]);

  if (isLoading) return <p className="sports-state">Chargement...</p>;
  if (error) return <p className="sports-state">{error}</p>;

  return (
    <>
      <HeroSport />
      <Recherche value={query} onChange={setQuery} />
      <div className="container-sports">
        {filteredSports.length === 0 ? (
          <p className="sports-state">
            Aucun sport ne correspond à ta recherche.
          </p>
        ) : (
          <ul className="container-sports__list">
            {filteredSports.map((sport) => {
              const { icon: Icon, color } = getSportVisual(sport.name);
              return (
                <li
                  key={sport.id}
                  className="sport-card"
                  style={{ boxShadow: `0 4px 14px ${getSportShadow(color)}` }}
                >
                  <div className="sport-card__thumb">
                    <img
                      src={getSportPhoto(sport.name)}
                      alt={sport.name}
                      className="sport-card__photo"
                      onError={handlePhotoError}
                    />
                    <span
                      className="sport-card__badge"
                      style={{ backgroundColor: color }}
                    >
                      <Icon color={getIconColor(color)} size={16} />
                    </span>
                  </div>

                  <h3 className="sport-card__name">{sport.name}</h3>

                  <div className="sport-card__stats">
                    <span className="sport-card__stat">
                      <Calendar size={13} />
                      {sport.activitiesCount} sortie
                      {sport.activitiesCount === 1 ? "" : "s"}
                    </span>
                    <span className="sport-card__stat">
                      <Users size={13} />
                      {sport.participantsCount} participant
                      {sport.participantsCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`sport-card__favorite${favoriteIds.has(sport.id) ? " sport-card__favorite--active" : ""}`}
                    onClick={() => handleToggleFavorite(sport.id)}
                    aria-label={
                      favoriteIds.has(sport.id)
                        ? `Retirer ${sport.name} des favoris`
                        : `Ajouter ${sport.name} aux favoris`
                    }
                    aria-pressed={favoriteIds.has(sport.id)}
                  >
                    <Heart
                      size={16}
                      fill={favoriteIds.has(sport.id) ? "currentColor" : "none"}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <ContactSport />

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
