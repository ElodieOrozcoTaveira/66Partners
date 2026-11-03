import { BellRing, Camera, Car, Check, MessageCircle, Plus } from "lucide-react";
import { useBranding } from "../../../contexts/TerritoryContext";
import { getSportPhoto } from "../../../lib/sportPhotos";
import "./Bento.scss";

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="bento__list">
      {items.map((item) => (
        <li key={item}>
          <Check size={16} strokeWidth={3} />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** « Le principe » : grille de cartes aux couleurs du territoire. */
export default function Bento() {
  const { brandName } = useBranding();

  return (
    <section className="bento page-container" aria-labelledby="bento-titre">
      <div className="bento__head">
        <span className="eyebrow eyebrow--center">Le principe</span>
        <h2 id="bento-titre" className="bento__titre">
          Faire du sport ensemble,
          <br />
          près de chez toi.
        </h2>
        <p className="bento__intro">
          {brandName} réunit les sportifs de ton territoire : tu proposes une sortie, d'autres te
          rejoignent.
        </p>
      </div>

      <div className="bento__grid">
        <article className="bento__card bento__card--white bento__card--wide">
          <div className="bento__text">
            <span className="bento__kicker">Explorer</span>
            <h3>Trouve ta prochaine sortie</h3>
            <p>Sport, date, lieu, niveau et places restantes : chaque activité annonce l'essentiel.</p>
            <Checklist items={["Filtres par sport, date et public", "Activités entre femmes ou entre hommes", "Rejoindre en un clic"]} />
          </div>
          <div className="bento__visual bento__visual--explore" aria-hidden="true">
            <div className="bento__chips">
              <span className="is-active">Aujourd'hui</span>
              <span>Demain</span>
              <span>Ce week-end</span>
            </div>
            {["Running", "Randonnée"].map((sport, index) => (
              <div key={sport} className="bento__mini-card">
                <img src={getSportPhoto(sport)} alt="" loading="lazy" />
                <div>
                  <strong>{index === 0 ? "Footing au lever du soleil" : "Rando des crêtes"}</strong>
                  <span>{index === 0 ? "Demain · 07:30" : "Sam. · 09:00"}</span>
                </div>
                <em>{index === 0 ? "3 places" : "5 places"}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="bento__card bento__card--brand">
          <div className="bento__text">
            <span className="bento__kicker">Communauté</span>
            <h3>Ton groupe, ta discussion</h3>
            <p>Chaque activité a sa discussion de groupe, ses photos souvenirs et son covoiturage.</p>
          </div>
          <div className="bento__visual bento__visual--chat" aria-hidden="true">
            <div className="bento__bubble">On se retrouve au parking ?</div>
            <div className="bento__bubble bento__bubble--me">Oui, 7h20 devant le panneau 👍</div>
            <div className="bento__icons">
              <span><MessageCircle size={18} /></span>
              <span><Camera size={18} /></span>
              <span><Car size={18} /></span>
            </div>
          </div>
        </article>

        <article className="bento__card bento__card--beige">
          <div className="bento__text">
            <span className="bento__kicker">Publier</span>
            <h3>Crée ton activité</h3>
            <p>Sport, lieu, date, niveau et nombre de places : c'est publié.</p>
            <Checklist items={["Covoiturage en option", "Rappel la veille et 1 h avant"]} />
          </div>
          <div className="bento__visual bento__visual--publish" aria-hidden="true">
            <span className="bento__fab">
              <Plus size={26} />
            </span>
            <div className="bento__toast">
              <BellRing size={16} /> Rappel : c'est demain !
            </div>
          </div>
        </article>

        <article className="bento__card bento__card--accent bento__card--wide">
          <div className="bento__text">
            <span className="bento__kicker">Profil</span>
            <h3>Ton profil sportif</h3>
            <p>Tes sports favoris, tes disponibilités, les sorties que tu rejoins et celles que tu organises.</p>
            <Checklist items={["Sports favoris et disponibilités", "Notifications des nouvelles demandes", "Sportifs autour de toi"]} />
          </div>
          <div className="bento__visual bento__visual--profile" aria-hidden="true">
            <div className="bento__stats">
              <div><strong>12</strong><span>Sorties</span></div>
              <div><strong>4</strong><span>Créées</span></div>
              <div><strong>3</strong><span>Sports</span></div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
