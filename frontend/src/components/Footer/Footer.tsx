import { MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './Footer.scss';
import FollowUs from '../BurgerComponent/followUs/FollowUs';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import Fleche from '../Fleche/Fleche';

export default function Footer() {
    const { ref, visible } = useRevealOnScroll<HTMLElement>(0.1);

    return(
        <>
            <footer
                ref={ref}
                className={`container-footer reveal-on-scroll${visible ? ' is-visible' : ''}`}
            >
                <img src="/newLogo.png" alt="logo de l'application"
                height={100}
                width={120} className="container-footer__img" />
                <div className="container-footer__underline"></div>
                <h2 className="container-footer__h2bis">La plateforme qui connecte les sportifs des Pyrénées-Orientales</h2>
                <div className="container-footer__lieux"><MapPin size={14} color='#F4B400'/>Pyrénées-Orientales, France</div>
                <FollowUs onDark/>

                <div className="container-footer__docs">
                    <NavLink to="/mentionslegales" className="container-footer__doclink">
                        Mentions légales
                    </NavLink>
                    <span className="container-footer__docsep">·</span>
                    <NavLink to="/confidentialite" className="container-footer__doclink">
                        Politique de confidentialité
                    </NavLink>
                </div>

                <Fleche/>
            </footer>
        </>
    )
}