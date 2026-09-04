import { CalendarDays, Flame, Smile, Target } from "lucide-react";
import { formatMonthYear } from "../../../lib/dateFormat";
import './Apropos.scss';

interface AproposProfileProps {
    headline: string | null;
    lookingFor: string | null;
    openTo: string | null;
    createdAt: string | null;
    isOwnProfile?: boolean;
}

export default function AproposProfile({
    headline,
    lookingFor,
    openTo,
    createdAt,
    isOwnProfile = true,
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

            {createdAt && (
                <>
                    <div className="container-aproposProfile__divider" />
                    <div className="container-aproposProfile__col container-aproposProfile__col--meta">
                        <p className="container-aproposProfile__line">
                            <CalendarDays size={16} strokeWidth={2.2} />
                            Membre depuis {formatMonthYear(new Date(createdAt))}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
