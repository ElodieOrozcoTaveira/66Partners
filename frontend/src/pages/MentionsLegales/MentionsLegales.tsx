import '../../styles/legal/legal.scss';

export function MentionsLegales() {
  return (
    <div className="legal-container">
      <h1 className="legal-title">Mentions légales</h1>

      <p className="legal-intro">
        Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004
        pour la confiance dans l'économie numérique, il est précisé aux
        utilisateurs de la plateforme 66Partners et de ses déclinaisons
        territoriales (34Partners, 11Partners, 31Partners, 32Partners,
        09Partners, 30Partners, 81Partners) l'identité des différents
        intervenants dans le cadre de sa réalisation et de son suivi. Ces
        mentions s'appliquent au site web et à l'application mobile.
        <br />
        <br />
        Elles comprennent également les conditions d'utilisation du
        service, que vous acceptez en créant un compte.
      </p>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Éditeur du site</h2>

        <ul className="legal-list">
          <li>
            <span className="legal-label">Nom :</span> CanailleDev
          </li>

          <li>
            <span className="legal-label">Adresse :</span>{' '}
            Pyrénées-Orientales, France
          </li>

          <li>
            <span className="legal-label">Email :</span>{' '}
            <a
              className="legal-link"
              href="mailto:contact@66partners.fr"
            >
              contact@66partners.fr
            </a>
          </li>

          <li>
            <span className="legal-label">Statut :</span> Particulier
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Hébergeur</h2>

        <ul className="legal-list">
          <li>
            <span className="legal-label">Société :</span>{' '}
            Hetzner Online GmbH
          </li>

          <li>
            <span className="legal-label">Adresse :</span>{' '}
            Industriestr. 25, 91710 Gunzenhausen, Allemagne
          </li>

          <li>
            <span className="legal-label">Téléphone :</span> +49 (0)9831 505-0
          </li>

          <li>
            <span className="legal-label">Site web :</span>{' '}
            <a
              className="legal-link"
              href="https://www.hetzner.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.hetzner.com
            </a>
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          Propriété intellectuelle
        </h2>

        <p className="legal-text">
          La plateforme 66Partners, ainsi que ses déclinaisons territoriales,
          son identité graphique, ses logos, ses textes, son interface,
          ses éléments graphiques et les éléments logiciels développés
          spécifiquement pour son fonctionnement sont protégés par les
          dispositions applicables en matière de propriété intellectuelle.
        </p>

        <p className="legal-text">
          Toute reproduction, représentation, modification ou exploitation
          de ces éléments, en tout ou partie, sans autorisation préalable,
          est interdite.
        </p>

        <p className="legal-text">
          Les contenus publiés par les utilisateurs restent soumis aux
          droits qui leur sont applicables.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Conditions d'utilisation</h2>

        <h3 className="legal-subtitle-sm">Objet du service</h3>
        <p className="legal-text">
          La plateforme permet à des sportifs de se rencontrer, de proposer
          et de rejoindre des activités sportives près de chez eux, et
          d'échanger avec les autres participants. L'inscription est
          gratuite.
        </p>

        <h3 className="legal-subtitle-sm">Compte</h3>
        <p className="legal-text">
          Vous vous engagez à fournir des informations exactes, à garder
          votre mot de passe confidentiel et à n'utiliser qu'un seul compte.
          Vous pouvez supprimer votre compte à tout moment depuis
          l'application (Profil &gt; Paramètres) ou le site (Mon profil).
        </p>

        <h3 className="legal-subtitle-sm">Règles de conduite</h3>
        <p className="legal-text">
          La plateforme applique une tolérance zéro envers les contenus et
          comportements abusifs. Il est notamment interdit de :
        </p>
        <ul className="legal-list">
          <li>harceler, menacer, insulter ou discriminer un autre membre ;</li>
          <li>
            publier des contenus à caractère sexuel, violent, haineux,
            illégal ou portant atteinte aux droits d'autrui (photos de
            personnes sans leur accord, par exemple) ;
          </li>
          <li>usurper l'identité d'une autre personne ou créer un faux profil ;</li>
          <li>
            utiliser le service à des fins commerciales, publicitaires ou de
            démarchage sans autorisation ;
          </li>
          <li>
            mettre volontairement en danger d'autres participants lors d'une
            activité.
          </li>
        </ul>

        <h3 className="legal-subtitle-sm">Signalement, blocage et modération</h3>
        <p className="legal-text">
          Chaque membre peut signaler un profil, un message, une activité ou
          une photo, et bloquer un autre membre. Les signalements sont
          examinés rapidement par l'équipe de la plateforme, qui peut
          supprimer un contenu, avertir, suspendre ou supprimer le compte
          d'un membre qui ne respecte pas ces règles, sans préavis en cas
          de manquement grave. En cas de danger immédiat, contactez le 17
          (police) ou le 112.
        </p>

        <h3 className="legal-subtitle-sm">Activités sportives</h3>
        <p className="legal-text">
          Les activités sont organisées par les membres eux-mêmes, et non par
          la plateforme. Chaque participant pratique sous sa propre
          responsabilité : il lui appartient de vérifier que l'activité
          correspond à son niveau et à sa condition physique, et de
          disposer, le cas échéant, d'une assurance adaptée. Le covoiturage
          éventuel est convenu directement entre les membres concernés.
        </p>

        <h3 className="legal-subtitle-sm">Services tiers (Strava)</h3>
        <p className="legal-text">
          La connexion à Strava est facultative. En reliant votre compte
          Strava, vous acceptez aussi les conditions d'utilisation de Strava,
          et vous autorisez 66Partners à modifier le titre et la description
          d'une de vos activités Strava, uniquement lorsque vous appuyez sur
          « Valider notre rencontre ». Vous pouvez retirer cet accès à tout
          moment (« Déconnecter Strava » sur votre profil, ou depuis vos
          réglages Strava). 66Partners n'est ni édité, ni sponsorisé, ni
          approuvé par Strava, Inc. ; « Strava » est une marque de Strava,
          Inc. Cette fonctionnalité dépend du service de Strava et peut être
          modifiée ou interrompue si Strava fait évoluer ses conditions.
        </p>

        <h3 className="legal-subtitle-sm">Contenus publiés</h3>
        <p className="legal-text">
          Vous restez responsable des contenus que vous publiez (profil,
          messages, photos, activités) et garantissez disposer des droits
          nécessaires. Vous autorisez la plateforme à les afficher aux
          autres membres concernés, dans le seul cadre du service.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Responsabilité</h2>

        <p className="legal-text">
          L'éditeur s'efforce de fournir un service accessible et des
          informations aussi exactes et à jour que possible.
        </p>

        <p className="legal-text">
          Toutefois, compte tenu notamment de la nature participative de
          la plateforme, l'éditeur ne peut garantir l'exactitude,
          l'exhaustivité ou l'actualité de l'ensemble des informations
          publiées par les utilisateurs.
        </p>

        <p className="legal-text">
          L'éditeur ne saurait être tenu responsable des contenus publiés
          directement par les utilisateurs ni des conséquences résultant
          d'une utilisation du service contraire à sa finalité ou aux
          règles applicables.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Droit applicable</h2>

        <p className="legal-text">
          Les présentes mentions légales sont soumises au droit français.
        </p>

        <p className="legal-text">
          En cas de litige, les règles de compétence juridictionnelle
          applicables au litige concerné s'appliquent.
        </p>
      </section>

      <hr className="legal-divider" />

      <p className="legal-update">
        Dernière mise à jour : novembre 2026
      </p>
    </div>
  );
}