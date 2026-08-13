import { Clock } from 'lucide-react';
import './Dispo.scss';

interface DispoProps {
    dispo: string | null;
    isOwnProfile?: boolean;
}

export default function Dispo({ dispo, isOwnProfile = true }: DispoProps) {
    return(
         <div className="container-dispo">
            <h2 className="container-dispo__h2">
                <Clock size={13} strokeWidth={2.4} />
                Disponibilités
            </h2>
            {dispo ? (
                <p className="container-dispo__text">{dispo}</p>
            ) : (
                <p className="container-dispo__empty">
                    {isOwnProfile
                        ? "Tu n'as pas encore ajouté de dispo."
                        : "Aucune disponibilité renseignée."}
                </p>
            )}
        </div>
    )
}