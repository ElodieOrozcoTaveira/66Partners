import './Confidentalité.scss';

export function PolitiqueConfidentialite() {
  return (
    <div className="legal-container">
      <h1 className="legal-title">
        Politique de confidentialité
      </h1>

      <p className="legal-intro">
        La plateforme 66Partners et ses déclinaisons territoriales
        accordent une grande importance à la protection de vos données
        personnelles.
        <br />
        <br />
        Cette politique vous informe sur les données personnelles
        collectées, les finalités de leur traitement, leur durée de
        conservation, leurs destinataires et les droits dont vous
        disposez, conformément au règlement général sur la protection
        des données (RGPD) et à la loi Informatique et Libertés.
      </p>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          1. Responsable du traitement
        </h2>

        <ul className="legal-list">
          <li>
            <span className="legal-label">Nom :</span> CanailleDev
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
        </ul>

        <p className="legal-text">
          Cette politique s'applique à la plateforme 66Partners ainsi
          qu'à ses déclinaisons territoriales, notamment 34Partners,
          lorsque celles-ci sont proposées dans le cadre du même service.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          2. Données personnelles collectées
        </h2>

        <h3 className="legal-subtitle-sm">
          Lors de l'inscription
        </h3>

        <ul className="legal-list">
          <li>Pseudo</li>
          <li>Adresse email</li>
          <li>
            Mot de passe, stocké sous une forme cryptographiquement
            protégée et jamais en clair
          </li>
          <li>
            Territoire de rattachement sélectionné lors de l'inscription
          </li>
        </ul>

        <h3 className="legal-subtitle-sm">
          Lors de l'utilisation de la plateforme
        </h3>

        <ul className="legal-list">
          <li>Ville de résidence</li>
          <li>
            Localisation approximative lorsque la fonctionnalité
            concernée est utilisée
          </li>
          <li>Photo de profil, si vous en ajoutez une</li>
          <li>Sports pratiqués et niveau déclaré</li>
          <li>Activités créées et participations</li>
          <li>Messages échangés dans le cadre de la plateforme</li>
          <li>Avis et notations laissés sur la plateforme</li>
          <li>Territoire(s) auquel/auxquels votre compte est rattaché</li>
        </ul>

        <h3 className="legal-subtitle-sm">
          Données techniques
        </h3>

        <ul className="legal-list">
          <li>Adresse IP</li>
          <li>Données de connexion et de navigation</li>
          <li>
            Données techniques nécessaires au fonctionnement de la
            session et de l'authentification
          </li>
          <li>
            Données techniques liées aux notifications push lorsque
            cette fonctionnalité est activée
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          3. Finalités et bases légales
        </h2>

        <table className="legal-table">
          <thead>
            <tr>
              <th className="legal-th">Donnée / traitement</th>
              <th className="legal-th">Finalité</th>
              <th className="legal-th">Base légale</th>
            </tr>
          </thead>

          <tbody>
            {[
              [
                'Email et mot de passe',
                'Création, authentification et sécurisation du compte',
                'Exécution du contrat',
              ],
              [
                'Territoire de rattachement',
                'Déterminer le territoire actif et proposer les utilisateurs, activités et fonctionnalités correspondant à ce territoire',
                'Exécution du contrat',
              ],
              [
                'Ville',
                'Permettre la recherche et la mise en relation entre sportifs dans une zone géographique donnée',
                'Exécution du contrat',
              ],
              [
                'Localisation',
                'Permettre certaines fonctionnalités de proximité lorsque l’utilisateur les utilise',
                'Exécution du contrat',
              ],
              [
                'Sports et niveaux',
                'Permettre la recherche, le filtrage et la mise en relation entre utilisateurs partageant des pratiques sportives',
                'Exécution du contrat',
              ],
              [
                'Activités et participations',
                'Créer, gérer et permettre la participation à des activités sportives',
                'Exécution du contrat',
              ],
              [
                'Messages',
                "Permettre la communication entre les utilisateurs dans le cadre de la plateforme",
                'Exécution du contrat',
              ],
              [
                'Avis et notations',
                'Permettre aux utilisateurs de partager une évaluation liée à leur expérience sur la plateforme',
                'Intérêt légitime',
              ],
              [
                'Adresse IP et données techniques',
                'Sécurité, prévention des abus et maintien du fonctionnement de la plateforme',
                'Intérêt légitime',
              ],
              [
                'Notifications push',
                "Envoyer des notifications relatives au fonctionnement de la plateforme lorsque l'utilisateur les active",
                'Consentement',
              ],
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
        <h2 className="legal-subtitle">
          4. Territoires et données associées
        </h2>

        <p className="legal-text">
          La plateforme fonctionne avec un système de territoires
          correspondant notamment à différents départements.
        </p>

        <p className="legal-text">
          Lors de votre inscription, vous sélectionnez votre territoire
          de rattachement. Cette information permet notamment de
          déterminer le contexte territorial de votre compte et de vous
          proposer les activités, utilisateurs et contenus correspondant
          au territoire sélectionné.
        </p>

        <p className="legal-text">
          Un même compte peut être rattaché à plusieurs territoires
          lorsque cette fonctionnalité est disponible. Le changement
          de territoire ne crée pas un nouveau compte et n'entraîne pas
          automatiquement la suppression des données associées à votre
          compte.
        </p>

        <p className="legal-text">
          Les activités créées sur la plateforme sont également
          associées à un territoire afin de permettre leur affichage
          dans le contexte territorial correspondant.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          5. Durée de conservation
        </h2>

        <table className="legal-table">
          <thead>
            <tr>
              <th className="legal-th">Donnée</th>
              <th className="legal-th">
                Durée de conservation
              </th>
            </tr>
          </thead>

          <tbody>
            {[
              [
                'Données de compte',
                'Pendant la durée de vie du compte, puis pendant la durée nécessaire aux obligations légales ou à la défense des droits de l’éditeur',
              ],
              [
                'Messages',
                "Pendant la durée nécessaire au fonctionnement du service et, le cas échéant, pendant la durée nécessaire à la gestion d'un signalement ou d'un litige",
              ],
              [
                'Avis et notations',
                'Pendant la durée de vie du compte et selon les nécessités liées à la gestion des contestations ou obligations légales',
              ],
              [
                'Données de connexion',
                'Pendant la durée nécessaire à la sécurité et au respect des obligations légales applicables',
              ],
              [
                'Données de navigation et cookies',
                'Selon la nature du traceur, sa finalité et les règles applicables',
              ],
              [
                'Abonnement aux notifications push',
                "Jusqu'à sa désactivation par l'utilisateur, la suppression du compte ou la révocation de l'autorisation par le navigateur",
              ],
            ].map(([donnee, duree]) => (
              <tr key={donnee} className="legal-tr">
                <td className="legal-td">{donnee}</td>
                <td className="legal-td">{duree}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="legal-text">
          Les durées définitives de conservation sont déterminées en
          fonction de la finalité du traitement et des obligations
          légales applicables.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          6. Destinataires et partage des données
        </h2>

        <p className="legal-text">
          Les données personnelles ne sont pas vendues à des tiers.
        </p>

        <p className="legal-text">
          Selon les besoins du service, certaines données peuvent être
          accessibles ou transmises aux catégories de destinataires
          suivantes :
        </p>

        <ul className="legal-list">
          <li>
            <span className="legal-label">
              Autres utilisateurs :
            </span>{' '}
            certaines informations de profil et d'activité rendues
            visibles dans le cadre des fonctionnalités de mise en
            relation.
          </li>

          <li>
            <span className="legal-label">
              Prestataires techniques :
            </span>{' '}
            les données strictement nécessaires à l'hébergement,
            au fonctionnement technique et à la fourniture des services
            associés à la plateforme.
          </li>

          <li>
            <span className="legal-label">
              Autorités compétentes :
            </span>{' '}
            lorsque la communication des données est imposée par une
            obligation légale ou une décision de justice.
          </li>
        </ul>

        <p className="legal-text">
          Les prestataires intervenant pour le compte de la plateforme
          sont sélectionnés en fonction des besoins du service et des
          exigences applicables en matière de protection et de sécurité
          des données.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          7. Visibilité des informations
        </h2>

        <p className="legal-text">
          Certaines informations renseignées sur votre profil peuvent
          être visibles par les autres utilisateurs afin de permettre
          le fonctionnement des fonctionnalités de recherche et de mise
          en relation.
        </p>

        <p className="legal-text">
          Selon les fonctionnalités disponibles, peuvent notamment être
          visibles : votre pseudo, votre photo de profil, votre ville,
          vos sports pratiqués, votre niveau et les informations liées
          aux activités auxquelles vous participez.
        </p>

        <p className="legal-text">
          Les informations qui ne sont pas nécessaires à la mise en
          relation ou au fonctionnement du service ne sont pas destinées
          à être rendues publiques.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          8. Vos droits
        </h2>

        <p className="legal-text">
          Conformément au RGPD, vous disposez notamment des droits
          suivants :
        </p>

        <ul className="legal-list">
          <li>
            <span className="legal-label">
              Droit d'accès :
            </span>{' '}
            obtenir confirmation du traitement de vos données et en
            obtenir une copie.
          </li>

          <li>
            <span className="legal-label">
              Droit de rectification :
            </span>{' '}
            demander la correction de données inexactes ou incomplètes.
          </li>

          <li>
            <span className="legal-label">
              Droit à l'effacement :
            </span>{' '}
            demander la suppression de vos données lorsque les conditions
            prévues par le RGPD sont réunies.
          </li>

          <li>
            <span className="legal-label">
              Droit à la limitation :
            </span>{' '}
            demander, dans certaines situations, la limitation du
            traitement de vos données.
          </li>

          <li>
            <span className="legal-label">
              Droit d'opposition :
            </span>{' '}
            vous opposer à certains traitements lorsque les conditions
            prévues par le RGPD sont réunies.
          </li>

          <li>
            <span className="legal-label">
              Droit à la portabilité :
            </span>{' '}
            recevoir certaines données dans un format structuré,
            couramment utilisé et lisible par machine.
          </li>
        </ul>

        <p className="legal-text">
          Pour exercer vos droits :
          {' '}
          <a
            className="legal-link"
            href="mailto:contact@66partners.fr"
          >
            contact@66partners.fr
          </a>
        </p>

        <p className="legal-text">
          Vous pouvez également introduire une réclamation auprès de la
          Commission Nationale de l'Informatique et des Libertés (CNIL).
        </p>

        <p className="legal-text">
          <a
            className="legal-link"
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.cnil.fr
          </a>
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          9. Sécurité des données
        </h2>

        <ul className="legal-list">
          <li>
            Mots de passe protégés par une fonction de hachage
            cryptographique adaptée.
          </li>

          <li>
            Communications sécurisées en HTTPS/TLS.
          </li>

          <li>
            Accès aux données limité aux personnes et systèmes qui en
            ont besoin pour assurer le fonctionnement du service.
          </li>

          <li>
            Mesures de sauvegarde et de protection de l'infrastructure
            technique.
          </li>

          <li>
            Procédure de gestion des violations de données et notification
            aux autorités compétentes lorsque la réglementation l'exige.
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          10. Cookies et traceurs
        </h2>

        <p className="legal-text">
          La plateforme peut utiliser des cookies ou technologies
          similaires nécessaires à son fonctionnement, notamment pour
          la session, l'authentification et la sécurité.
        </p>

        <p className="legal-text">
          Les cookies ou traceurs qui ne sont pas strictement nécessaires
          au fonctionnement du service sont soumis aux règles applicables
          en matière d'information et, lorsque cela est requis, de
          consentement préalable.
        </p>

        <p className="legal-text">
          Les informations présentées dans cette politique sont mises à
          jour afin de correspondre aux technologies effectivement
          utilisées par la plateforme.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          11. Notifications push
        </h2>

        <p className="legal-text">
          Si vous l'acceptez explicitement, la plateforme peut vous
          envoyer des notifications push sur votre téléphone ou votre
          ordinateur afin de vous informer notamment de nouveaux
          messages ou d'événements liés à vos activités.
        </p>

        <ul className="legal-list">
          <li>
            <span className="legal-label">
              Données techniques :
            </span>{' '}
            un identifiant technique associé au navigateur ou à
            l'appareil ainsi que les éléments techniques nécessaires
            au fonctionnement du protocole Web Push.
          </li>

          <li>
            <span className="legal-label">
              Activation :
            </span>{' '}
            aucune notification push n'est activée sans action de
            l'utilisateur.
          </li>

          <li>
            <span className="legal-label">
              Retrait :
            </span>{' '}
            les notifications peuvent être désactivées depuis les
            paramètres prévus par la plateforme ou depuis les
            paramètres de notification du navigateur.
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">
          12. Modifications de la politique
        </h2>

        <p className="legal-text">
          Cette politique de confidentialité peut être mise à jour afin
          de tenir compte de l'évolution de la plateforme, de ses
          fonctionnalités, de ses traitements de données ou de la
          réglementation applicable.
        </p>

        <p className="legal-text">
          En cas de modification substantielle nécessitant une
          information particulière des utilisateurs, ceux-ci seront
          informés par un moyen approprié.
        </p>
      </section>

      <hr className="legal-divider" />

      <p className="legal-update">
        Dernière mise à jour : septembre 2026
      </p>
    </div>
  );
}