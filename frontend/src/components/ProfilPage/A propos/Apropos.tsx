import { CalendarDays, Flame, MapPin, Smile, Target } from "lucide-react";
import { formatMonthYear } from "../../../lib/dateFormat";
import './Apropos.scss';

interface AproposProfileTerritory {
    code: string;
    name: string;
    brandName: string;
}

interface AproposProfileProps {
    headline: string | null;
    lookingFor: string | null;
    openTo: string | null;
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
    lookingFor,
    openTo,
    createdAt,
    isOwnProfile = true,
    territory,
}: AproposProfileProps) {
    const hasContent = Boolean(headline || lookingFor || openTo);

    return (
        <div className="container-aproposProfile">
            <div className="container-aproposProfile__col">
                {headline && (
                    <p className="container-aproposProfile__line">
                        <Flame size={16} strokeWidth={2.2} />
                        {headline}
                    </p>
                )}
                {lookingFor && (
                    <p className="container-aproposProfile__line">
                        <Target size={16} strokeWidth={2.2} />
                        {lookingFor}
                    </p>
                )}
                {openTo && (
                    <p className="container-aproposProfile__line">
                        <Smile size={16} strokeWidth={2.2} />
                        {openTo}
                    </p>
                )}
                {!hasContent && (
                    <p className="container-aproposProfile__empty">
                        {isOwnProfile
                            ? "Ajoute quelques infos depuis « Modifier le profil »."
                            : "Aucune information renseignée."}
                    </p>
                )}
            </div>

            {(createdAt || territory) && (
                <>
                    <div className="container-aproposProfile__divider" />
                    <div className="container-aproposProfile__col container-aproposProfile__col--meta">
                        {createdAt && (
                            <p className="container-aproposProfile__line">
                                <CalendarDays size={16} strokeWidth={2.2} />
                                Membre depuis {formatMonthYear(new Date(createdAt))}
                            </p>
                        )}
                        {territory && (
                            <p className="container-aproposProfile__line">
                                <MapPin size={16} strokeWidth={2.2} />
                                {territory.brandName}
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
