import { MapPin } from 'lucide-react';
import './Footer.scss';
import FollowUs from '../BurgerComponent/followUs/FollowUs';

export default function Footer() {
    return(
        <>
            <footer className="container-footer">
                <img src="/logo66remove.png" alt="logo de l'application"
                height={50}
                width={70} className="container-footer__img" />
                <div className="container-footer__underline"></div>
                <h2 className="container-footer__h2bis">La plateforme qui connecte les sportifs des Pyrénées-Orientales</h2>
                <div className="container-footer__lieux"><MapPin size={14} color='#F4B400'/>Pyrénées-Orientales, France</div>
                <FollowUs onDark/>
            </footer>
        </>
    )
}