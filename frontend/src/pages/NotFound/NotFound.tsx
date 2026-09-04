import { Link } from "react-router-dom";
import { Compass, House, MapPinned } from "lucide-react";
import "./NotFound.scss";

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-page__card">
        <img src="/logo3.webp" alt="66Partners" className="notfound-page__logo" />

        <span className="notfound-page__icon">
          <Compass size={26} strokeWidth={2.2} />
        </span>

        <p className="notfound-page__code">404</p>
        <h1 className="notfound-page__title">Page introuvable</h1>
        <p className="notfound-page__text">
          Cette page n'existe pas ou a été déplacée. Repars à l'aventure et
          retrouve ton chemin vers 66Partners.
        </p>

        <div className="notfound-page__actions">
          <Link to="/" className="notfound-page__primary">
            <House size={16} strokeWidth={2.2} />
            Retour à l'accueil
          </Link>
          <Link to="/sports" className="notfound-page__secondary">
            <MapPinned size={16} strokeWidth={2.2} />
            Découvrir les sports
          </Link>
        </div>
      </div>
    </div>
  );
}
