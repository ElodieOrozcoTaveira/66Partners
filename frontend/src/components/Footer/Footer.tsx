import { MapPin } from "lucide-react";
import { NavLink } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import { SiInstagram } from "react-icons/si";
import "./Footer.scss";
import Fleche from "../Fleche/Fleche";
import { useBranding } from "../../contexts/TerritoryContext";

interface FooterProps {
  /** Masqué en mobile/tablette, visible seulement à partir du laptop */
  hideOnMobile?: boolean;
}

/** Pied de page de la refonte : sobre, colonnes de liens (inspiré de Rovent). */
export default function Footer({ hideOnMobile = false }: FooterProps) {
  const { asset, territoryOf, territoryName, brandName } = useBranding();

  return (
    <footer className={`container-footer${hideOnMobile ? " container-footer--laptop-only" : ""}`}>
      <div className="container-footer__inner">
        <div className="container-footer__brand">
          <img src={asset("logo")} alt={`logo ${brandName}`} height={64} width={110} className="container-footer__img" />
          <p className="container-footer__tagline">La plateforme qui connecte les sportifs {territoryOf}.</p>
          <p className="container-footer__lieux">
            <MapPin size={14} />
            {territoryName ? `${territoryName}, France` : "France"}
          </p>
          <div className="container-footer__social">
            <a
              href="https://www.instagram.com/66par.tners/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur Instagram"
            >
              <SiInstagram size={17} />
            </a>
            <a
              href="https://www.facebook.com/66Partners"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur Facebook"
            >
              <FaFacebook size={18} />
            </a>
          </div>
        </div>

        <nav className="container-footer__cols" aria-label="Pied de page">
          <div>
            <p className="container-footer__coltitle">{brandName}</p>
            <NavLink to="/sports">Sports</NavLink>
            <NavLink to="/fonctionnement">Comment ça marche</NavLink>
            <NavLink to="/pourquoi66">Pourquoi {brandName}</NavLink>
          </div>
          <div>
            <p className="container-footer__coltitle">Aide</p>
            <NavLink to="/FAQ">Questions fréquentes</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <NavLink to="/admin">Administrateur</NavLink>
          </div>
          <div>
            <p className="container-footer__coltitle">Légal</p>
            <NavLink to="/mentionslegales">Mentions légales</NavLink>
            <NavLink to="/confidentialite">Politique de confidentialité</NavLink>
          </div>
        </nav>
      </div>
      <p className="container-footer__copy">
        © {new Date().getFullYear()} {brandName} · Tous droits réservés
      </p>
      <Fleche />
    </footer>
  );
}
