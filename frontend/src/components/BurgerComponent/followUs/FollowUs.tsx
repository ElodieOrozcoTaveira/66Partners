import { Mountain } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';
import { FaFacebook } from 'react-icons/fa';
import './FollowUs.scss';
import { useBranding } from "../../../contexts/TerritoryContext";

type FollowUsProps = {
    onDark?: boolean;
};

export default function FollowUs({ onDark = false }: FollowUsProps) {
  const { taglineLead, taglineAccent, brandName, territoryOf } = useBranding();
    const accentColor = onDark ? 'var(--brand-accent-dark, #F4B400)' : 'var(--brand-primary-dark, #C62828)';

    return (
        <div className={`container-followUs${onDark ? ' container-followUs--onDark' : ''}`}>
            <p className="container-followUs__tagline">
                {taglineLead} <span>{taglineAccent}</span>
            </p>

            <div className="container-followUs__divider">
                <span className="container-followUs__line" />
                <Mountain size={20} color={accentColor} />
                <span className="container-followUs__line" />
            </div>

            <p className="container-followUs__label">Suivez-nous</p>

            <div className="container-followUs__reseaux">
                <a
                    href="https://www.instagram.com/66par.tners/"
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
                {brandName} – L'application qui connecte les sportifs {territoryOf}.
            </p>

        </div>
    );
}
