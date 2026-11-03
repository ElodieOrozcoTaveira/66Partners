import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Heart, Plus, Settings2, X } from "lucide-react";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
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
                console.error(
                    "MesSports: failed to fetch favorites",
                    err instanceof Error ? err.message : "Erreur inconnue",
                );
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
            console.error(
                "MesSports: failed to remove favorite",
                err instanceof Error ? err.message : "Erreur inconnue",
            );
            setFavoriteSports((prev) => [...prev, removed]);
        }
    }

    if (!userId) return null;

    return (
        <section className="container-mesSports" aria-labelledby="mes-sports-titre">
            <div className="container-mesSports__header">
                <div className="container-mesSports__heading">
                    <span className="container-mesSports__icon">
                        <Heart size={16} strokeWidth={2.4} />
                    </span>
                    <div>
                        <h2 id="mes-sports-titre" className="container-mesSports__h2">
                            {isOwnProfile ? "Mes sports" : "Ses sports"}
                        </h2>
                        {!isLoading && favoriteSports.length > 0 ? (
                            <p className="container-mesSports__count">
                                {favoriteSports.length} sport{favoriteSports.length > 1 ? "s" : ""} favori
                                {favoriteSports.length > 1 ? "s" : ""}
                            </p>
                        ) : null}
                    </div>
                </div>
                {isOwnProfile && favoriteSports.length > 0 && (
                    <NavLink to="/sports" className="container-mesSports__manage">
                        <Settings2 size={15} strokeWidth={2.2} />
                        Gérer
                    </NavLink>
                )}
            </div>

            {isLoading ? (
                <div className="container-mesSports__grid" aria-busy="true">
                    {[0, 1, 2].map((key) => (
                        <span key={key} className="mesSports-tile mesSports-tile--skeleton" />
                    ))}
                </div>
            ) : favoriteSports.length === 0 ? (
                isOwnProfile ? (
                    <div className="container-mesSports__empty">
                        <p>
                            Ajoute tes sports favoris : on te montrera les sorties qui te correspondent
                            et les autres sportifs sauront ce que tu pratiques.
                        </p>
                        <NavLink to="/sports" className="btn btn--primary">
                            <Plus size={17} /> Ajouter mes sports
                        </NavLink>
                    </div>
                ) : (
                    <p className="container-mesSports__none">Aucun sport favori pour le moment.</p>
                )
            ) : (
                <div className="container-mesSports__grid">
                    {favoriteSports.map((sport) => {
                        const { icon: Icon, color } = getSportVisual(sport.name);
                        return (
                            <div key={sport.id} className="mesSports-tile">
                                <NavLink to="/sports" className="mesSports-tile__link" aria-label={sport.name}>
                                    <img src={getSportPhoto(sport.name)} alt="" loading="lazy" />
                                    <span className="mesSports-tile__shade" />
                                    <span className="mesSports-tile__badge" style={{ backgroundColor: color }}>
                                        <Icon size={16} color={getIconColor(color)} strokeWidth={2.2} />
                                    </span>
                                    <span className="mesSports-tile__name">{sport.name}</span>
                                </NavLink>
                                {isOwnProfile && (
                                    <button
                                        type="button"
                                        className="mesSports-tile__remove"
                                        onClick={() => handleRemove(sport.id)}
                                        aria-label={`Retirer ${sport.name} des favoris`}
                                        title="Retirer des favoris"
                                    >
                                        <X size={13} strokeWidth={2.6} />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {isOwnProfile && (
                        <NavLink to="/sports" className="mesSports-tile mesSports-tile--add">
                            <span className="mesSports-tile__plus">
                                <Plus size={20} strokeWidth={2.4} />
                            </span>
                            <span>Ajouter</span>
                        </NavLink>
                    )}
                </div>
            )}
        </section>
    );
}
