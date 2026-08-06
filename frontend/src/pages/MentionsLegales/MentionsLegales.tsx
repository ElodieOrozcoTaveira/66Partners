export function MentionsLegales() {
  return (
    <div className="legal-container">
      <h1 className="legal-title">Mentions légales</h1>

      <p className="legal-intro">
        Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004 pour la confiance dans
        l'économie numérique, il est précisé aux utilisateurs du site 66Partners l'identité des
        différents intervenants dans le cadre de sa réalisation et de son suivi.
      </p>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Éditeur du site</h2>
        <ul className="legal-list">
          <li><span className="legal-label">Nom :</span> CanailleDev</li>
          <li><span className="legal-label">Adresse :</span> Pyrénées-Orientales</li>
          <li>
            <span className="legal-label">Email :</span>{' '}
            <a className="legal-link" href="mailto:contact@66partners.fr">
              contact@66partners.fr
            </a>
          </li>
          <li><span className="legal-label">Statut :</span> Particulier</li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Hébergeur</h2>
        <ul className="legal-list">
          <li><span className="legal-label">Société :</span> Hetzner Online GmbH </li>
          <li><span className="legal-label">Adresse :</span> Industriestr. 25, 91710 Gunzenhausen, Allemagne</li>
          <li>
            <span className="legal-label">Site web :</span>{' '}
            <a className="legal-link" href="https://www.hetzner.com" target="_blank" rel="noopener noreferrer">
              www.hetzner.com
            </a>
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Propriété intellectuelle</h2>
        <p className="legal-text">
          Le site 66Partners et l'ensemble de son contenu (logo, textes, visuels, interface) sont
          la propriété exclusive de l'éditeur. Toute reproduction, représentation, modification ou
          exploitation non autorisée est interdite.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Responsabilité</h2>
        <p className="legal-text">
          L'éditeur s'efforce de fournir des informations exactes et à jour sur le site 66Partners.
          Toutefois, il ne peut garantir l'exactitude, la complétude ou l'actualité des informations
          diffusées. L'éditeur décline toute responsabilité pour les dommages directs ou indirects
          résultant de l'utilisation du site.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">Droit applicable</h2>
        <p className="legal-text">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les
          tribunaux français seront seuls compétents.
        </p>
      </section>

      <hr className="legal-divider" />

      <p className="legal-update">Dernière mise à jour : juillet 2026</p>
    </div>
  );
};

