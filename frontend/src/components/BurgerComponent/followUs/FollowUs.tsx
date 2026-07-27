import { Mountain } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { FaFacebook } from 'react-icons/fa';
import './FollowUs.scss';

type FollowUsProps = {
    onDark?: boolean;
};

export default function FollowUs({ onDark = false }: FollowUsProps) {
    const accentColor = onDark ? '#F4B400' : '#C62828';

    return (
        <div className={`container-followUs${onDark ? ' container-followUs--onDark' : ''}`}>
            <p className="container-followUs__tagline">
                Ton sport. Ton partenaire. <span>Ton 66.</span>
            </p>

            <div className="container-followUs__divider">
                <span className="container-followUs__line" />
                <Mountain size={20} color={accentColor} />
                <span className="container-followUs__line" />
            </div>

            <p className="container-followUs__label">Suivez-nous</p>

            <div className="container-followUs__reseaux">
                <a
                    href="https://www.instagram.com/66partners/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez-nous sur Instagram"
                    className="container-followUs__icon"
                >
                    <SiInstagram size={18} color={accentColor} />
                </a>
                <a
                    href="https://www.facebook.com/66Partners"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez-nous sur Facebook"
                    className="container-followUs__icon"
                >
                    <FaFacebook size={20} color={accentColor} />
                </a>
            </div>

            <p className="container-followUs__desc">
                66Partners – L'application qui connecte les sportifs des Pyrénées-Orientales.
            </p>

        </div>
    );
}
