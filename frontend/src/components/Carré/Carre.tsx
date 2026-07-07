import { MapPin, ShieldCheck, Users } from 'lucide-react';
import './Carre.scss';

const carre = [
    { id: 1, titre: '100% local', soustitre: 'Dans les Pyrénées Orientales', Logo: MapPin },
    { id: 2, titre: 'Communauté', soustitre: 'Active et Bienveillante', Logo: Users },
    { id: 3, titre: 'Confiance', soustitre: 'Des sportifs près de chez toi', Logo: ShieldCheck },
];

export default function Carre() {
    return (
        <div className="container-carre">
            {carre.map(({ id, titre, soustitre, Logo }) => (
                <div className={`carre-item carre-item--${id}`} key={id}>
                    <Logo className="carre-item__logo" size={18} />
                    <div className="carre-item__text">
                        <h3 className="carre-item__titre">{titre}</h3>
                        <p className="carre-item__soustitre">{soustitre}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
