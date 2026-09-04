import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronRight, Heart, Plus, X } from "lucide-react";
import api from "../../../lib/axios";
import { getSportVisual } from "../../../lib/sportVisuals";
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
            <div className="container-mesSports__header">
                <h2 className="container-mesSports__h2">
                    <Heart size={13} strokeWidth={2.4} />
                    Mes sports
                </h2>
                {isOwnProfile && (
                    <NavLink to="/sports" className="container-mesSports__manage">
                        Gérer mes sports
                        <ChevronRight size={14} strokeWidth={2.4} />
                    </NavLink>
                )}
            </div>
            {isLoading ? (
                <p className="container-mesSports__empty">Chargement...</p>
            ) : favoriteSports.length === 0 && !isOwnProfile ? (
                <p className="container-mesSports__empty">Aucun sport favori pour le moment.</p>
            ) : (
                <div className="container-mesSports__list">
                    {favoriteSports.map((sport) => {
                        const { icon: Icon, color } = getSportVisual(sport.name);
                        return (
                            <div
                                key={sport.id}
                                className="mesSports-item"
                                style={{ background: `${color}1F` }}
                            >
                                <NavLink
                                    to="/sports"
                                    className="mesSports-item__link"
                                    title={sport.name}
                                    aria-label={sport.name}
                                >
                                    <span className="mesSports-item__badge">
                                        <Icon size={20} color={color} strokeWidth={2.2} />
                                    </span>
                                    <span className="mesSports-item__name">{sport.name}</span>
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
                                <span className="mesSports-item__bar" style={{ background: color }} />
                            </div>
                        );
                    })}

                    {isOwnProfile && (
                        <NavLink to="/sports" className="mesSports-item mesSports-item--add">
                            <span className="mesSports-item__badge">
                                <Plus size={18} strokeWidth={2.4} />
                            </span>
                            <span className="mesSports-item__name">Ajouter un sport</span>
                        </NavLink>
                    )}
                </div>
            )}
        </div>
    );
}
