import { Clock } from 'lucide-react';
import './Dispo.scss';

interface DispoProps {
    dispo: string | null;
    isOwnProfile?: boolean;
}

export default function Dispo({ dispo, isOwnProfile = true }: DispoProps) {
    return(
         <div className="container-dispo">
            <span className="container-dispo__icon">
                <Clock size={16} strokeWidth={2.2} />
            </span>
            <div className="container-dispo__body">
                <h4 className="container-dispo__label">Disponibilités</h4>
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
        </div>
    )
}