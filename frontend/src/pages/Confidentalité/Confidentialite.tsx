import '../../styles/legal/legal.scss';

// Déclinaisons territoriales couvertes par cette politique (même service,
// même base de données, même responsable de traitement).
const TERRITORY_BRANDS =
  '66Partners, 34Partners, 11Partners, 31Partners, 32Partners, 09Partners, 30Partners, 81Partners, 82Partners, 65Partners, 46Partners, 12Partners et 48Partners';

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="legal-table">
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell} className="legal-th">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]} className="legal-tr">
            {row.map((cell, i) => (
              <td key={i} className="legal-td">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PolitiqueConfidentialite() {
  return (
    <div className="legal-container">
      <h1 className="legal-title">Politique de confidentialité</h1>

      <p className="legal-intro">
        La plateforme 66Partners et ses déclinaisons territoriales accordent
        une grande importance à la protection de vos données personnelles.
        <br />
        <br />
        Cette politique vous informe sur les données collectées, les
        finalités de leur traitement, leur durée de conservation, leurs
        destinataires et les droits dont vous disposez, conformément au
        règlement général sur la protection des données (RGPD) et à la loi
        Informatique et Libertés. Elle s'applique au site web et à
        l'application mobile.
      </p>

      <p className="legal-text">
        <strong className="legal-bold">Service réservé aux personnes majeures.</strong>{' '}
        L'inscription est réservée aux personnes âgées de 18 ans ou plus.
        Nous ne collectons pas sciemment de données concernant des mineurs :
        une date de naissance est demandée à l'inscription et l'inscription
        est refusée si elle indique moins de 18 ans. Si nous apprenons qu'un
        compte appartient à une personne mineure, il est supprimé avec ses
        données.
      </p>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">1. Responsable du traitement</h2>

        <ul className="legal-list">
          <li>
            <span className="legal-label">Nom :</span> CanailleDev
          </li>
          <li>
            <span className="legal-label">Email :</span>{' '}
            <a className="legal-link" href="mailto:contact@66partners.fr">
              contact@66partners.fr
            </a>
          </li>
        </ul>

        <p className="legal-text">
          Cette politique s'applique à l'ensemble des déclinaisons
          territoriales du service ({TERRITORY_BRANDS}), qui forment une
          seule et même plateforme : un compte unique, une même base de
          données et un même responsable de traitement.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">2. Données personnelles collectées</h2>

        <h3 className="legal-subtitle-sm">Lors de l'inscription</h3>
        <ul className="legal-list">
          <li>Pseudo et adresse email</li>
          <li>
            Date de naissance, demandée uniquement pour vérifier que vous
            avez au moins 18 ans
          </li>
          <li>
            Mot de passe, stocké sous une forme cryptographiquement protégée
            et jamais en clair
          </li>
          <li>Territoire de rattachement choisi lors de l'inscription</li>
          <li>Date d'acceptation des conditions et de la présente politique</li>
        </ul>

        <h3 className="legal-subtitle-sm">Connexion avec Google</h3>
        <p className="legal-text">
          Si vous choisissez de vous connecter avec Google (site et
          application), nous recevons de Google l'identifiant de votre
          compte Google, votre adresse email, votre prénom et, le cas
          échéant, votre photo de profil, afin de créer votre compte ou de
          vous reconnaître. Votre mot de passe Google ne nous est jamais
          transmis, et nous ne publions rien en votre nom.
        </p>

        <h3 className="legal-subtitle-sm">Connexion à Strava (facultative)</h3>
        <p className="legal-text">
          Si vous choisissez de relier votre compte Strava depuis votre profil
          (« Connect with Strava »), Strava vous demande d'autoriser
          66Partners à lire vos activités, y compris privées, et à modifier
          leur titre et leur description. Nous recevons et conservons alors :
        </p>
        <ul className="legal-list">
          <li>l'identifiant de votre compte Strava, votre prénom et nom, et l'adresse de votre photo de profil Strava ;</li>
          <li>les autorisations accordées et les jetons d'accès fournis par Strava, conservés chiffrés ;</li>
          <li>
            pour chaque rencontre validée, le numéro de l'activité Strava
            concernée (pour afficher le lien « View on Strava »).
          </li>
        </ul>
        <p className="legal-text">
          Nous n'accédons à vos activités Strava qu'au moment où vous appuyez
          sur « Valider notre rencontre » sur une sortie passée : nous
          consultons alors la liste de vos activités enregistrées autour de
          l'heure de la sortie, pour retrouver la bonne, puis nous modifions
          son titre (« Sortie … avec » suivi du pseudo de vos partenaires) et
          ajoutons une phrase à sa description. Ces données d'activité ne
          sont pas conservées. Nous n'enregistrons ni vos parcours GPS, ni vos
          performances, ni vos données de santé, et nous n'utilisons jamais
          vos données Strava à d'autres fins (publicité, revente, profilage,
          entraînement d'intelligence artificielle).
        </p>

        <h3 className="legal-subtitle-sm">
          Lors de l'utilisation de la plateforme
        </h3>
        <ul className="legal-list">
          <li>
            Informations de profil que vous choisissez de renseigner : ville,
            présentation (« à propos »), photo de profil
          </li>
          <li>Sports favoris, sports pratiqués et niveau déclaré</li>
          <li>Disponibilités hebdomadaires</li>
          <li>Activités créées et demandes de participation</li>
          <li>
            Choix « je souhaite covoiturer » pour une activité, lorsque
            l'organisateur propose le covoiturage
          </li>
          <li>Messages échangés dans les discussions d'activité</li>
          <li>Photos ajoutées à une activité terminée</li>
          <li>Territoire(s) auquel(s) votre compte est rattaché</li>
          <li>Notifications reçues dans l'application (et leur statut lu / non lu)</li>
          <li>
            Genre (« Femme » ou « Homme »), uniquement si vous choisissez de
            le renseigner
          </li>
          <li>
            Position approximative (à environ 1 km près), uniquement si vous
            autorisez la localisation (application mobile ou site)
          </li>
          <li>Signalements que vous envoyez et membres que vous bloquez</li>
          <li>
            Messages envoyés via le formulaire de contact (nom, email,
            message)
          </li>
        </ul>

        <p className="legal-text">
          <strong className="legal-bold">Genre déclaré.</strong> Cette
          information est facultative : vous pouvez choisir « Je préfère ne
          pas préciser », auquel cas rien n'est enregistré. Elle sert
          uniquement à permettre d'organiser ou de rejoindre une activité
          réservée (« entre femmes » ou « entre hommes »), le contrôle étant
          fait automatiquement au moment de la demande de participation. Elle
          n'est jamais affichée sur votre profil, n'est pas visible des autres
          membres ni utilisée à d'autres fins. Vous pouvez la modifier ou la
          retirer à tout moment depuis « Modifier mon profil » ; elle est
          supprimée avec votre compte.
        </p>

        <p className="legal-text">
          <strong className="legal-bold">Position approximative.</strong> Sur
          l'application mobile, ou sur le site lorsque vous utilisez « Autour de
          moi », si vous autorisez l'accès à votre localisation, les activités
          proches sont mises en avant et une position arrondie à environ 1 km
          est enregistrée. Elle sert uniquement à afficher le
          nombre de sportifs présents dans un rayon de 50 km : aucune position
          n'est jamais affichée ni communiquée aux autres membres, qui ne
          voient qu'un nombre. La localisation n'est utilisée que lorsque
          l'application ou le site est ouvert, jamais en arrière-plan. Vous
          pouvez la refuser ou la retirer à tout moment dans les réglages de
          votre téléphone ou de votre navigateur ; la position enregistrée est supprimée automatiquement
          après 30 jours sans mise à jour, et avec votre compte.
        </p>

        <p className="legal-text">
          <strong className="legal-bold">Photos et appareil photo.</strong>{' '}
          L'application mobile n'accède à votre appareil photo ou à vos
          photos qu'au moment où vous choisissez d'ajouter une photo de
          profil ou une photo d'activité, et seule la photo choisie est
          envoyée.
        </p>

        <h3 className="legal-subtitle-sm">Données techniques</h3>
        <ul className="legal-list">
          <li>Adresse IP</li>
          <li>Données de connexion (dates de création et de mise à jour du compte)</li>
          <li>
            Jeton de session permettant de rester connecté, conservé sur votre
            appareil (stockage chiffré du téléphone pour l'application)
          </li>
          <li>
            Données techniques liées aux notifications push, lorsque vous les
            activez
          </li>
          <li>
            Mesure d'audience du site (Google Analytics), uniquement si vous
            l'acceptez dans la bannière cookies
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">3. Finalités et bases légales</h2>

        <Table
          head={['Donnée / traitement', 'Finalité', 'Base légale']}
          rows={[
            ['Email et mot de passe', 'Création, authentification et sécurisation du compte', 'Exécution du contrat'],
            ['Date de naissance', 'Vérifier que le membre est majeur (18 ans ou plus), condition d\'inscription', 'Exécution du contrat'],
            ['Connexion avec Google', 'Créer le compte ou se connecter sans mot de passe 66Partners', 'Exécution du contrat'],
            ['Territoire de rattachement', 'Déterminer le territoire actif et proposer les membres et activités correspondants', 'Exécution du contrat'],
            ['Profil, sports, disponibilités', 'Présenter les membres et faciliter la mise en relation entre sportifs', 'Exécution du contrat'],
            ['Activités, participations, covoiturage', 'Créer, gérer et rejoindre des activités sportives, organiser un trajet commun', 'Exécution du contrat'],
            ['Messages et photos d\'activité', 'Permettre aux participants d\'une activité d\'échanger et de partager leurs souvenirs', 'Exécution du contrat'],
            ['Notifications dans l\'application et rappels', 'Prévenir des demandes, réponses, messages et rappeler une activité la veille et 1 h avant', 'Exécution du contrat'],
            ['Emails de service', 'Bienvenue, vérification de l\'adresse email, réinitialisation du mot de passe, confirmation de liaison Strava, confirmation de suppression du compte', 'Exécution du contrat'],
            ['Connexion à Strava', 'Relier votre compte Strava et, à votre demande, renommer l\'activité Strava d\'une sortie avec vos partenaires', 'Consentement'],
            ['Genre déclaré', 'Accès aux activités réservées « entre femmes » / « entre hommes »', 'Consentement'],
            ['Position approximative', 'Afficher le nombre de sportifs à proximité', 'Consentement'],
            ['Notifications push', 'Envoyer des notifications sur l\'appareil lorsque vous les activez', 'Consentement'],
            ['Mesure d\'audience', 'Statistiques de fréquentation du site', 'Consentement'],
            ['Signalements et blocages', 'Protéger les membres, modérer les contenus et faire respecter les règles d\'utilisation', 'Intérêt légitime'],
            ['Formulaire de contact', 'Répondre à votre demande', 'Intérêt légitime'],
            ['Adresse IP et données techniques', 'Sécurité, prévention des abus et bon fonctionnement de la plateforme', 'Intérêt légitime'],
          ]}
        />
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">4. Territoires et données associées</h2>

        <p className="legal-text">
          La plateforme fonctionne avec un système de territoires
          correspondant à des départements. Lors de votre inscription, vous
          choisissez votre territoire de rattachement, qui détermine les
          activités et les membres qui vous sont proposés.
        </p>
        <p className="legal-text">
          Un même compte peut rejoindre plusieurs territoires. Changer de
          territoire ne crée pas de nouveau compte et ne supprime aucune
          donnée. Chaque activité est rattachée au territoire dans lequel elle
          a été créée.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">5. Signalements et blocages</h2>

        <p className="legal-text">
          Vous pouvez signaler un membre, un message, une activité ou une
          photo, et bloquer un membre.
        </p>
        <ul className="legal-list">
          <li>
            <span className="legal-label">Signalement :</span> nous
            enregistrons le motif choisi, vos éventuelles précisions et une
            copie du contenu signalé au moment du signalement, afin que
            l'équipe de modération puisse l'examiner même s'il est supprimé
            ensuite. L'administrateur en est prévenu par email. Le membre
            signalé n'est pas informé de votre identité.
          </li>
          <li>
            <span className="legal-label">Blocage :</span> les deux membres
            ne voient plus leurs profils, activités, messages et photos
            respectifs, et les demandes de l'un aux activités à venir de
            l'autre sont retirées. Le membre bloqué n'en est pas informé. Vous
            pouvez débloquer un membre à tout moment depuis vos paramètres
            (application) ou votre profil (site).
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">6. Durée de conservation</h2>

        <Table
          head={['Donnée', 'Durée de conservation']}
          rows={[
            ['Données de compte et de profil', 'Pendant la durée de vie du compte. Elles sont supprimées immédiatement lorsque vous supprimez votre compte.'],
            ['Messages, participations, photos que vous avez ajoutées, notifications, disponibilités, sports, blocages', 'Pendant la durée de vie du compte, puis supprimés avec lui.'],
            ['Activités que vous avez créées', 'Elles restent visibles pour leurs participants après la suppression de votre compte, sans aucun lien avec vous (organisateur affiché comme « compte supprimé »).'],
            ['Date de naissance', 'Pendant la durée de vie du compte, puis supprimée avec lui.'],
            ['Position approximative', '30 jours sans mise à jour au maximum, et supprimée avec le compte.'],
            ['Données Strava (identifiant, nom, photo, jetons, numéros des activités validées)', 'Jusqu\'à ce que vous déconnectiez Strava, que vous retiriez l\'accès depuis Strava ou que vous supprimiez votre compte. Elles sont alors effacées et l\'accès est révoqué auprès de Strava.'],
            ['Signalements', 'Le temps nécessaire à leur traitement et à la gestion d\'un éventuel litige. Si un compte concerné est supprimé, le signalement est conservé sans lien avec ce compte.'],
            ['Messages du formulaire de contact', 'Le temps nécessaire au traitement de la demande.'],
            ['Abonnement aux notifications push', 'Jusqu\'à sa désactivation, la suppression du compte ou le retrait de l\'autorisation dans le navigateur ou le téléphone.'],
            ['Cookie de choix de la bannière cookies', '12 mois.'],
            ['Cookies de mesure d\'audience (si acceptés)', '13 mois maximum.'],
            ['Données de connexion et de sécurité', 'Pendant la durée nécessaire à la sécurité et au respect des obligations légales.'],
          ]}
        />
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">7. Destinataires et partage des données</h2>

        <p className="legal-text">
          Les données personnelles ne sont jamais vendues. Elles peuvent être
          accessibles aux destinataires suivants, chacun pour ce qui le
          concerne :
        </p>

        <ul className="legal-list">
          <li>
            <span className="legal-label">Autres membres :</span> les
            informations de profil et d'activité nécessaires à la mise en
            relation (voir la section 8).
          </li>
          <li>
            <span className="legal-label">Administrateur de la plateforme :</span>{' '}
            pour le support et la modération. Le contenu des discussions
            n'est consulté que lorsqu'un message est signalé.
          </li>
          <li>
            <span className="legal-label">Hébergement :</span> Hetzner Online
            GmbH (Allemagne), qui héberge les serveurs et la base de données
            dans l'Union européenne.
          </li>
          <li>
            <span className="legal-label">Envoi des emails :</span> OVHcloud
            (France), pour les emails de service.
          </li>
          <li>
            <span className="legal-label">Google :</span> connexion avec
            Google si vous la choisissez, mesure d'audience du site si vous
            l'acceptez, et affichage de la carte sur l'application Android
            (Google Maps).
          </li>
          <li>
            <span className="legal-label">Apple :</span> affichage de la
            carte sur l'application iPhone (Plans).
          </li>
          <li>
            <span className="legal-label">OpenFreeMap :</span> fonds de la
            carte des activités sur le site. Votre navigateur charge les
            images de la carte depuis leurs serveurs, qui reçoivent donc votre
            adresse IP ; aucun cookie n'est déposé et aucune information de
            compte n'est transmise.
          </li>
          <li>
            <span className="legal-label">Strava, Inc. (États-Unis) :</span>{' '}
            uniquement si vous reliez votre compte Strava. Nous transmettons à
            Strava les demandes d'autorisation, de lecture et de modification
            décrites ci-dessus, et votre navigateur affiche votre photo de
            profil Strava depuis les serveurs de Strava. Strava traite vos
            données selon sa propre politique de confidentialité.
          </li>
          <li>
            <span className="legal-label">API Géo de l'État (geo.api.gouv.fr) :</span>{' '}
            suggestion des communes lorsque vous saisissez une ville ; seul
            le texte saisi est transmis.
          </li>
          <li>
            <span className="legal-label">Autorités compétentes :</span>{' '}
            lorsque la communication des données est imposée par la loi ou
            une décision de justice.
          </li>
        </ul>

        <p className="legal-text">
          Certains de ces prestataires (Google, Apple, Strava) peuvent traiter
          des données aux États-Unis. Ces transferts sont encadrés par la
          décision d'adéquation de la Commission européenne
          (Data Privacy Framework) ou par des clauses contractuelles types.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">8. Visibilité des informations</h2>

        <p className="legal-text">
          Sont visibles des autres membres connectés : votre pseudo, votre
          photo de profil, votre ville, votre présentation, vos sports et
          niveaux, vos disponibilités, des statistiques d'activité (nombre
          d'activités créées ou rejointes) et les activités que vous
          organisez.
        </p>
        <p className="legal-text">
          Les messages d'une discussion ne sont visibles que par
          l'organisateur et les participants acceptés de l'activité (ou par
          les deux personnes concernées pour une discussion de covoiturage).
          Les photos d'une activité ne sont visibles que par son organisateur
          et ses participants acceptés.
        </p>
        <p className="legal-text">
          Ne sont jamais affichés aux autres membres : votre adresse email,
          votre date de naissance (ni votre âge), votre genre, votre position, les membres que vous avez bloqués
          ou signalés, et le fait que vous ayez relié Strava (votre nom et
          votre photo Strava ne sont visibles que par vous).
        </p>
        <p className="legal-text">
          <strong className="legal-bold">Rencontres validées sur Strava.</strong>{' '}
          Si un participant d'une sortie à laquelle vous avez pris part
          valide la rencontre, votre pseudo 66Partners apparaît dans le titre
          de son activité Strava, visible selon les réglages de
          confidentialité de son compte Strava.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">9. Vos droits</h2>

        <p className="legal-text">
          Conformément au RGPD, vous disposez des droits suivants :
        </p>

        <ul className="legal-list">
          <li>
            <span className="legal-label">Droit d'accès :</span> obtenir
            confirmation du traitement de vos données et en obtenir une copie.
          </li>
          <li>
            <span className="legal-label">Droit de rectification :</span>{' '}
            corriger des données inexactes ; la plupart se modifient
            directement depuis « Modifier mon profil ».
          </li>
          <li>
            <span className="legal-label">Droit à l'effacement :</span> vous
            pouvez supprimer vous-même votre compte à tout moment, depuis
            Profil &gt; Paramètres &gt; « Supprimer mon compte » dans
            l'application, ou depuis « Mon profil » sur le site. La
            suppression est immédiate et définitive.
          </li>
          <li>
            <span className="legal-label">Droit à la limitation :</span>{' '}
            demander, dans certaines situations, la limitation du traitement.
          </li>
          <li>
            <span className="legal-label">Droit d'opposition :</span> vous
            opposer à certains traitements fondés sur l'intérêt légitime.
          </li>
          <li>
            <span className="legal-label">Droit à la portabilité :</span>{' '}
            recevoir vos données dans un format structuré et lisible par
            machine.
          </li>
          <li>
            <span className="legal-label">Retrait du consentement :</span>{' '}
            à tout moment, pour le genre (« Modifier mon profil »), la
            localisation et les notifications (réglages du téléphone ou du
            navigateur), la mesure d'audience (en effaçant les cookies du
            site, la bannière vous est de nouveau proposée) et Strava
            (« Déconnecter Strava » sur votre profil, ou depuis vos réglages
            Strava, rubrique « Mes applications »).
          </li>
        </ul>

        <p className="legal-text">
          Pour exercer vos droits :{' '}
          <a className="legal-link" href="mailto:contact@66partners.fr">
            contact@66partners.fr
          </a>
        </p>

        <p className="legal-text">
          Vous pouvez également introduire une réclamation auprès de la
          Commission Nationale de l'Informatique et des Libertés (CNIL) :{' '}
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
        <h2 className="legal-subtitle">10. Sécurité des données</h2>

        <ul className="legal-list">
          <li>Mots de passe protégés par une fonction de hachage cryptographique adaptée.</li>
          <li>Communications chiffrées en HTTPS/TLS.</li>
          <li>Jeton de session conservé dans le stockage chiffré du téléphone sur l'application.</li>
          <li>Jetons d'accès Strava chiffrés (AES-256) en base de données, jamais transmis aux navigateurs.</li>
          <li>Photos d'activité accessibles uniquement par des liens protégés et limités dans le temps.</li>
          <li>Accès aux données limité aux personnes et systèmes qui en ont besoin.</li>
          <li>Sauvegardes et protection de l'infrastructure technique.</li>
          <li>
            Procédure de gestion des violations de données et notification
            aux autorités lorsque la réglementation l'exige.
          </li>
        </ul>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">11. Cookies et traceurs</h2>

        <h3 className="legal-subtitle-sm">Strictement nécessaires (sans consentement)</h3>
        <ul className="legal-list">
          <li>Jeton de session, pour rester connecté (stockage du navigateur ou stockage chiffré du téléphone)</li>
          <li>Territoire choisi et préférences d'affichage (rappels masqués, etc.)</li>
          <li>Cookie mémorisant votre choix dans la bannière cookies (12 mois)</li>
        </ul>

        <h3 className="legal-subtitle-sm">Mesure d'audience (avec consentement)</h3>
        <p className="legal-text">
          Sur le site, Google Analytics n'est chargé que si vous cliquez sur
          « Accepter » dans la bannière cookies. Si vous refusez ou ne faites
          aucun choix, aucun cookie de mesure d'audience n'est déposé.
          L'application mobile n'utilise aucun outil de mesure d'audience ni
          de publicité.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">12. Notifications</h2>

        <p className="legal-text">
          Les notifications dans l'application (nouvelle demande, réponse,
          message, rappel la veille et 1 h avant une activité) font partie du
          fonctionnement du service.
        </p>
        <p className="legal-text">
          Les notifications push sur le téléphone ou l'ordinateur ne sont
          envoyées que si vous les activez explicitement. Elles reposent sur
          un identifiant technique de votre navigateur ou appareil, et se
          désactivent à tout moment depuis les réglages de la plateforme, du
          navigateur ou du téléphone.
        </p>
      </section>

      <hr className="legal-divider" />

      <section className="legal-section">
        <h2 className="legal-subtitle">13. Modifications de la politique</h2>

        <p className="legal-text">
          Cette politique peut être mise à jour pour tenir compte de
          l'évolution de la plateforme ou de la réglementation. En cas de
          modification importante, les membres en sont informés par un moyen
          approprié.
        </p>
      </section>

      <hr className="legal-divider" />

      <p className="legal-update">Dernière mise à jour : 12 novembre 2026</p>
    </div>
  );
}
