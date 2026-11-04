import { Bell, Check, Compass, Home, MessageCircle, Plus, User, Users, MapPin } from "lucide-react";
import { FaAndroid } from "react-icons/fa";
import { useBranding } from "../../../contexts/TerritoryContext";
import { getSportPhoto } from "../../../lib/sportPhotos";
import "./AppAndroid.scss";

/** Téléphone affichant l'accueil de l'app mobile, aux couleurs du territoire. */
function PhoneMockup() {
  const { asset, territoryName } = useBranding();
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div className="phone__header" style={{ backgroundImage: `url(${asset("emblem")})` }}>
          <div className="phone__tint" />
          <div className="phone__row">
            <span className="phone__avatar" />
            <div className="phone__hello">
              <strong>Bonjour Léa</strong>
              <span>Envie d'une nouvelle aventure ?</span>
            </div>
            <span className="phone__bell">
              <Bell size={13} />
            </span>
          </div>
          <div className="phone__chips">
            <span>
              <MapPin size={10} /> {territoryName || "Mon territoire"}
            </span>
            <span>
              <Users size={10} /> Sportifs autour de toi
            </span>
          </div>
        </div>

        <div className="phone__hero" style={{ backgroundImage: `url(${getSportPhoto("Running")})` }}>
          <span className="phone__countdown">Demain</span>
          <div className="phone__hero-text">
            <small>TA PROCHAINE SORTIE</small>
            <strong>Footing au bord de l'eau</strong>
          </div>
        </div>

        <p className="phone__section">À venir autour de toi</p>
        <div className="phone__tiles">
          {["Randonnée", "Cyclisme"].map((sport) => (
            <div key={sport} className="phone__tile">
              <span style={{ backgroundImage: `url(${getSportPhoto(sport)})` }} />
              <strong>{sport}</strong>
              <em>2 places</em>
            </div>
          ))}
        </div>

        <div className="phone__tabs">
          <Home size={15} />
          <Compass size={15} />
          <span className="phone__plus">
            <Plus size={15} />
          </span>
          <MessageCircle size={15} />
          <User size={15} />
        </div>
      </div>
    </div>
  );
}

/** Annonce de l'app mobile Android (bientôt disponible). */
export default function AppAndroid() {
  const { brandName } = useBranding();
  return (
    <section className="app-android page-container" aria-labelledby="app-android-titre">
      <div className="app-android__card">
        <div className="app-android__text">
          <span className="eyebrow">Bientôt sur Android</span>
          <h2 id="app-android-titre" className="app-android__titre">
            {brandName} arrive
            <br />
            dans ta poche.
          </h2>
          <p>
            L'application mobile arrive très bientôt sur Android : toutes tes sorties, ta carte et tes
            discussions, toujours avec toi.
          </p>
          <ul className="app-android__list">
            <li><Check size={16} strokeWidth={3} /> Carte des activités autour de toi</li>
            <li><Check size={16} strokeWidth={3} /> Notifications et rappels avant chaque sortie</li>
            <li><Check size={16} strokeWidth={3} /> Sportifs dans un rayon de 25 km</li>
          </ul>
          <div className="app-android__badge">
            <FaAndroid size={26} />
            <span>
              <small>Bientôt disponible sur</small>
              Android
            </span>
          </div>
          <p className="app-android__hint">
            En attendant, installe le site sur ton écran d'accueil depuis ton navigateur.
          </p>
        </div>
        <div className="app-android__visual">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
