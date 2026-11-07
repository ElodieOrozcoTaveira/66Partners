import { NavLink } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import {
  Bell,
  Heart,
  Lightbulb,
  MessageCircle,
  MessageCircleHeart,
  Search,
  Share2,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { useBranding } from "../../../contexts/TerritoryContext";
import { getSportPhoto } from "../../../lib/sportPhotos";
import "./SuisNous.scss";

const FACEBOOK_URL = "https://www.facebook.com/66Partners/";

const PROMPTS = [
  { icon: Heart, text: "Ce que j'aime…", tone: "love" },
  { icon: Wrench, text: "Ce qui me manque…", tone: "fix" },
  { icon: Lightbulb, text: "Mon idée…", tone: "idea" },
] as const;

/** Téléphone montrant la page Facebook 66Partners (illustration, pas une capture). */
function FacebookPhone() {
  return (
    <div className="fb-phone" aria-hidden="true">
      <div className="fb-phone__notch" />
      <div className="fb-phone__screen">
        <div className="fb-phone__bar">
          <FaFacebook size={20} />
          <span className="fb-phone__search">
            <Search size={11} /> Rechercher
          </span>
          <Bell size={14} />
        </div>

        {/* Couverture de la page Facebook (public/couvertureFbk.webp) ; à défaut,
            celle du site, dessous. */}
        <div
          className="fb-phone__cover"
          style={{ backgroundImage: "url(/couvertureFbk.webp), url(/66partners/cover.webp)" }}
        />
        <div className="fb-phone__identity">
          <span className="fb-phone__avatar">
            <img src="/newLogo.webp" alt="" />
          </span>
          <strong>66Partners</strong>
          <small>Communauté sportive · Occitanie</small>
          <div className="fb-phone__buttons">
            <span className="fb-phone__btn fb-phone__btn--primary">
              <ThumbsUp size={11} /> Suivre
            </span>
            <span className="fb-phone__btn">
              <MessageCircle size={11} /> Message
            </span>
          </div>
        </div>

        <div className="fb-phone__post">
          <div className="fb-phone__post-head">
            <span className="fb-phone__mini-avatar">
              <img src="/newLogo.webp" alt="" />
            </span>
            <span>
              <strong>66Partners</strong>
              <small>À l'instant</small>
            </span>
          </div>
          <p>Quelle sortie aimerais-tu voir sur l'app ? Dis-nous tout en commentaire 👇</p>
          <div className="fb-phone__photo" style={{ backgroundImage: `url(${getSportPhoto("Randonnée")})` }} />
          <div className="fb-phone__actions">
            <span>
              <ThumbsUp size={11} /> J'aime
            </span>
            <span>
              <MessageCircle size={11} /> Commenter
            </span>
            <span>
              <Share2 size={11} /> Partager
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** « Suis-nous sur Facebook » : retours, idées et améliorations. */
export default function SuisNous() {
  const { brandName } = useBranding();
  return (
    <section className="suis-nous page-container" aria-labelledby="suis-nous-titre">
      <div className="suis-nous__card">
        <div className="suis-nous__text">
          <span className="suis-nous__eyebrow">
            <MessageCircleHeart size={15} strokeWidth={2.4} /> Ton avis compte
          </span>
          <h2 id="suis-nous-titre" className="suis-nous__titre">
            Suis-nous sur Facebook
          </h2>
          <p>
            {brandName} se construit avec toi. Partage tes ressentis, tes idées et ce qu'on peut améliorer : on lit
            tout, et beaucoup de nouveautés naissent de ces retours.
          </p>
          <ul className="suis-nous__prompts" aria-label="Ce que tu peux nous partager">
            {PROMPTS.map(({ icon: Icon, text, tone }) => (
              <li key={text} className={`suis-nous__prompt suis-nous__prompt--${tone}`}>
                <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <div className="suis-nous__actions">
            <a className="suis-nous__facebook" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
              <FaFacebook size={20} aria-hidden="true" />
              Rejoindre la page Facebook
            </a>
            <NavLink to="/contact" className="suis-nous__contact">
              Ou écris-nous directement
            </NavLink>
          </div>
        </div>

        <a
          className="suis-nous__visual"
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <FacebookPhone />
        </a>
      </div>
    </section>
  );
}
