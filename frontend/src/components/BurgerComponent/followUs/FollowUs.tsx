import { Mountain } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { FaFacebook } from 'react-icons/fa';
import './FollowUs.scss';

export default function FollowUs() {
    return (
        <div className="container-followUs">
            <p className="container-followUs__tagline">
                Ton sport. Ton partenaire. <span>Ton 66.</span>
            </p>

            <div className="container-followUs__divider">
                <span className="container-followUs__line" />
                <Mountain size={20} color="#ff4500" />
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
                    <SiInstagram size={18} color="#ff4500" />
                </a>
                <a
                    href="https://www.facebook.com/66partners/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Suivez-nous sur Facebook"
                    className="container-followUs__icon"
                >
                    <FaFacebook size={20} color="#ff4500" />
                </a>
            </div>

            <p className="container-followUs__desc">
                66Partners – L'application qui connecte les sportifs des Pyrénées-Orientales.
            </p>
            
        </div>
    );
}
