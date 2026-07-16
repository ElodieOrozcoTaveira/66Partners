import { MoveRight } from 'lucide-react';
import './Carre.scss';

interface CarreProps {
    onOpenRegister: () => void;
}

export default function Carre({ onOpenRegister }: CarreProps) {
    return (
        <div className="container-carre">
            <h3 className="container-carre__h3">Rejoignez la communauté!</h3>
            <p className="container-carre__p">Partagez vos aventures, découvrez de nouvelles activités et rencontrez des passionés.</p>
            <button type="button" className="container-carre__h4" onClick={onOpenRegister}>
                S'inscrire gratuitement <MoveRight size={14} />
            </button>
        </div>
    );
}
