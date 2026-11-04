import { CalendarDays, Flame, MapPin, UserRound } from "lucide-react";
import { formatMonthYear } from "../../../lib/dateFormat";
import './Apropos.scss';

interface AproposProfileTerritory {
    code: string;
    name: string;
    brandName: string;
}

interface AproposProfileProps {
    headline: string | null;
    createdAt: string | null;
    isOwnProfile?: boolean;
    // Territoire d'inscription (isDefault) de la personne dont on affiche le
    // profil — jamais le territoire actif du visiteur. Absent/undefined sur
    // son propre profil (non demandé pour cette page, cf. chantier dédié) ;
    // `null` explicite si le compte n'a pas de territoire principal.
    territory?: AproposProfileTerritory | null;
}

export default function AproposProfile({
    headline,
    createdAt,
    isOwnProfile = true,
    territory,
}: AproposProfileProps) {
    const lines = [
        { key: "headline", icon: Flame, label: "Présentation", text: headline },
    ].filter((line) => line.text);

    return (
        <section className="container-aproposProfile" aria-labelledby="apropos-titre">
            <h2 id="apropos-titre" className="container-aproposProfile__title">
                <UserRound size={18} strokeWidth={2.2} />
                À propos
            </h2>

            {lines.length > 0 ? (
                <ul className="container-aproposProfile__lines">
                    {lines.map(({ key, icon: Icon, label, text }) => (
                        <li key={key} className="container-aproposProfile__line">
                            <span className="container-aproposProfile__icon">
                                <Icon size={17} strokeWidth={2.2} />
                            </span>
                            <span className="container-aproposProfile__body">
                                <span className="container-aproposProfile__label">{label}</span>
                                <span className="container-aproposProfile__text">{text}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="container-aproposProfile__empty">
                    {isOwnProfile
                        ? "Présente-toi en quelques mots depuis « Modifier le profil »."
                        : "Aucune information renseignée pour l'instant."}
                </p>
            )}

            {(createdAt || territory) && (
                <div className="container-aproposProfile__meta">
                    {createdAt && (
                        <span className="container-aproposProfile__chip">
                            <CalendarDays size={15} strokeWidth={2.2} />
                            Membre depuis {formatMonthYear(new Date(createdAt)).toLowerCase()}
                        </span>
                    )}
                    {territory && (
                        <span className="container-aproposProfile__chip">
                            <MapPin size={15} strokeWidth={2.2} />
                            {territory.brandName}
                        </span>
                    )}
                </div>
            )}
        </section>
    );
}
