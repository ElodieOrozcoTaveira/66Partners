import './Confidentalité.scss';

export function PolitiqueConfidentialite()  {
  return (
    <div className="legal-container">
      <h1 className="legal-title">Politique de confidentialité</h1>

      <p className="legal-intro">
        66Partners accorde une grande importance à la protection de vos données personnelles.
        Cette politique vous informe sur la manière dont vos données sont collectées, utilisées
        et protégées, conformément au RGPD et à la loi Informatique et Libertés.
      </p>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">1. Responsable du traitement</h2>
        <ul className="legal-list">
          <li><span className="legal-label">Nom :</span> CanailleDev</li>
          <li>
            <span className="legal-label">Email :</span>{' '}
            <a className="legal-link" href="mailto:contact@66partners.fr">
              contact@66partners.fr
            </a>
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">2. Données collectées</h2>

        <h3 className="legal-subtitle-sm">Lors de l'inscription</h3>
        <ul className="legal-list">
          <li>Pseudo</li>
          <li>Adresse email</li>
          <li>Mot de passe (hashé, jamais stocké en clair)</li>
        </ul>

        <h3 className="legal-subtitle-sm">Lors de l'utilisation</h3>
        <ul className="legal-list">
          <li>Ville de résidence</li>
          <li>Localisation approximative (latitude/longitude)</li>
          <li>Photo de profil (optionnelle)</li>
          <li>Sports pratiqués et niveau</li>
          <li>Activités créées et participations</li>
          <li>Messages échangés dans le cadre d'une activité</li>
          <li>Avis et notations laissés</li>
        </ul>

        <h3 className="legal-subtitle-sm">Données techniques</h3>
        <ul className="legal-list">
          <li>Adresse IP</li>
          <li>Données de connexion et de navigation</li>
          <li>Cookies techniques nécessaires au fonctionnement</li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">3. Finalités du traitement</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th className="legal-th">Donnée</th>
              <th className="legal-th">Finalité</th>
              <th className="legal-th">Base légale</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Email, mot de passe', 'Authentification et sécurité du compte', 'Exécution du contrat'],
              ['Localisation', 'Mise en relation avec des partenaires à proximité', 'Exécution du contrat'],
              ['Sports et niveau', 'Filtrage et matching entre utilisateurs', 'Exécution du contrat'],
              ['Messages', "Communication entre participants d'une activité", 'Exécution du contrat'],
              ['Avis et notations', 'Score de fiabilité des utilisateurs', 'Intérêt légitime'],
              ['Adresse IP', 'Sécurité et prévention des abus', 'Intérêt légitime'],
            ].map(([donnee, finalite, base]) => (
              <tr key={donnee} className="legal-tr">
                <td className="legal-td">{donnee}</td>
                <td className="legal-td">{finalite}</td>
                <td className="legal-td">{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">4. Durée de conservation</h2>
        <table className="legal-table">
          <thead>
            <tr>
              <th className="legal-th">Donnée</th>
              <th className="legal-th">Durée de conservation</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Données de compte', 'Durée de vie du compte + 1 an après suppression'],
              ['Messages', "1 an après la fin de l'activité associée"],
              ['Avis et notations', "Durée de vie du compte de l'auteur"],
              ['Données de connexion', '12 mois'],
              ['Données de navigation', '13 mois maximum'],
            ].map(([donnee, duree]) => (
              <tr key={donnee} className="legal-tr">
                <td className="legal-td">{donnee}</td>
                <td className="legal-td">{duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">5. Partage des données</h2>
        <p className="legal-text">
          Vos données personnelles ne sont <span className="legal-bold">jamais vendues</span> à des tiers.
          Elles peuvent être partagées uniquement dans les cas suivants :
        </p>
        <ul className="legal-list">
          <li><span className="legal-label">Entre utilisateurs :</span> votre pseudo, ville, photo de profil, sports pratiqués et niveau sont visibles dans le cadre de la mise en relation</li>
          <li><span className="legal-label">Obligations légales :</span> en cas de réquisition judiciaire ou d'obligation légale</li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">6. Vos droits</h2>
        <p className="legal-text">Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="legal-list">
          <li><span className="legal-label">Droit d'accès :</span> obtenir une copie de vos données</li>
          <li><span className="legal-label">Droit de rectification :</span> corriger vos données inexactes</li>
          <li><span className="legal-label">Droit à l'effacement :</span> demander la suppression de vos données</li>
          <li><span className="legal-label">Droit à la limitation :</span> limiter le traitement de vos données</li>
          <li><span className="legal-label">Droit d'opposition :</span> vous opposer à certains traitements</li>
          <li><span className="legal-label">Droit à la portabilité :</span> récupérer vos données dans un format lisible</li>
        </ul>
        <p className="legal-text">
          Pour exercer ces droits :{' '}
          <a className="legal-link" href="mailto:contact@66partners.fr">contact@66partners.fr</a>
        </p>
        <p className="legal-text">
          Vous pouvez aussi introduire une réclamation auprès de la{' '}
          <a className="legal-link" href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">CNIL</a>.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">7. Sécurité des données</h2>
        <ul className="legal-list">
          <li>Chiffrement des mots de passe (Argon2)</li>
          <li>Communications sécurisées en HTTPS/TLS</li>
          <li>Accès aux données restreint au strict nécessaire</li>
          <li>Sauvegardes régulières des données</li>
          <li>Notification de toute violation de données dans les 72h à la CNIL</li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">8. Cookies</h2>
        <p className="legal-text">
          66Partners utilise uniquement des <span className="legal-bold">cookies techniques strictement nécessaires</span>{' '}
          au fonctionnement de la plateforme (session, authentification). Aucun cookie publicitaire
          ou de tracking n'est utilisé.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">9. Modifications</h2>
        <p className="legal-text">
          Cette politique de confidentialité peut être mise à jour. En cas de modification
          substantielle, vous serez informé par email ou via une notification sur la plateforme.
        </p>
      </section>

      <hr className="legal-divider" />

      <p className="legal-update">Dernière mise à jour : juillet 2026</p>
    </div>
  );
};

