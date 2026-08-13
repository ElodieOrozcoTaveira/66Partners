import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Heart, X } from "lucide-react";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import "./MesSports.scss";

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

interface MesSportsProps {
    userId: string | null;
    isOwnProfile?: boolean;
}

export default function MesSports({ userId, isOwnProfile = true }: MesSportsProps) {
    const [favoriteSports, setFavoriteSports] = useState<Sport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        let mounted = true;
        setIsLoading(true);

        async function fetchFavorites() {
            try {
                const favoritesUrl = isOwnProfile
                    ? "/api/sports/favorites/mine"
                    : `/api/sports/favorites/${userId}`;
                const [sportsRes, favoritesRes] = await Promise.all([
                    api.get<SportsResponse>("/api/sports"),
                    api.get<FavoritesResponse>(favoritesUrl),
                ]);
                if (!mounted) return;

                const favoriteIds = new Set(favoritesRes.data.sportIds);
                setFavoriteSports(
                    sportsRes.data.sports.filter((sport) => favoriteIds.has(sport.id)),
                );
            } catch (err) {
                console.error("MesSports: failed to fetch favorites", err);
                if (mounted) setFavoriteSports([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }

        fetchFavorites();

        return () => {
            mounted = false;
        };
    }, [userId, isOwnProfile]);

    async function handleRemove(sportId: string) {
        const removed = favoriteSports.find((sport) => sport.id === sportId);
        if (!removed) return;

        setFavoriteSports((prev) => prev.filter((sport) => sport.id !== sportId));

        try {
            await api.post(`/api/sports/${sportId}/favorite`);
        } catch (err) {
            console.error("MesSports: failed to remove favorite", err);
            setFavoriteSports((prev) => [...prev, removed]);
        }
    }

    if (!userId) return null;

    return (
        <div className="container-mesSports">
            <h2 className="container-mesSports__h2">
                <Heart size={13} strokeWidth={2.4} />
                Mes sports
            </h2>
            {isLoading ? (
                <p className="container-mesSports__empty">Chargement...</p>
            ) : favoriteSports.length === 0 ? (
                <p className="container-mesSports__empty">
                    {isOwnProfile
                        ? "Tu n'as pas encore ajouté de sport en favori."
                        : "Aucun sport favori pour le moment."}
                </p>
            ) : (
                <div className="container-mesSports__list">
                    {favoriteSports.map((sport) => {
                        const { icon: Icon, color } = getSportVisual(sport.name);
                        return (
                            <div key={sport.id} className="mesSports-item">
                                <div className="mesSports-item__badgeWrap">
                                    <NavLink
                                        to="/sports"
                                        className="mesSports-item__link"
                                        title={sport.name}
                                        aria-label={sport.name}
                                    >
                                        <span
                                            className="mesSports-item__badge"
                                            style={{ backgroundColor: color }}
                                        >
                                            <Icon color={getIconColor(color)} size={16} />
                                        </span>
                                    </NavLink>
                                    {isOwnProfile && (
                                        <button
                                            type="button"
                                            className="mesSports-item__remove"
                                            onClick={() => handleRemove(sport.id)}
                                            aria-label={`Retirer ${sport.name} des favoris`}
                                        >
                                            <X size={9} />
                                        </button>
                                    )}
                                </div>
                                <span className="mesSports-item__name">{sport.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
