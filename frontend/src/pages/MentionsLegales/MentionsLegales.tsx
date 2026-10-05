export function MentionsLegales() {
  return (
    <div className="legal-container">
      <h1 className="legal-title">Mentions légales</h1>

      <p className="legal-intro">
        Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004
        pour la confiance dans l'économie numérique, il est précisé aux
        utilisateurs de la plateforme 66Partners et de ses déclinaisons
        territoriales l'identité des différents intervenants dans le cadre
        de sa réalisation et de son suivi.
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
        Dernière mise à jour : septembre 2026
      </p>
    </div>
  );
}