# 66Partners — application mobile

Application Expo (SDK 57, React Native 0.86, Expo Router, TypeScript strict) connectée
au backend existant (`backend/`, Express + Drizzle + PostgreSQL). Aucune base ni règle
métier propre au mobile : le serveur reste l'autorité.

## Démarrer

```bash
cd mobile
npm install
cp .env.example .env      # puis choisir l'API (staging recommandé en dev)
npx expo start
```

Sans `.env`, l'app appelle **la production** (`https://api.66partners.fr`).

| Commande | Rôle |
| --- | --- |
| `npm run typecheck` | TypeScript strict |
| `npm run lint` | ESLint (config Expo) |
| `npm test` | Tests unitaires (jest-expo) |
| `npx expo-doctor` | Santé de la config et des dépendances |

## Variables d'environnement

Publiques (incluses dans l'app compilée) — jamais de secret.

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `EXPO_PUBLIC_API_ORIGIN` | `https://api.66partners.fr` | Origine du backend (sans `/api`) |
| `EXPO_PUBLIC_WEB_ORIGIN` | `https://66partners.fr` | Pages légales, contact, liens vers le site |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | — | Client OAuth web (même que le site/backend). Absent : bouton Google masqué |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | — | Client OAuth iOS. Absent : bouton Google masqué sur iPhone |

## Architecture

```
app/                      Routes Expo Router (un fichier = un écran)
  _layout.tsx             Providers + gardes Stack.Protected (auth / app)
  (auth)/                 login, register, forgot-password
  (tabs)/                 index (accueil), explorer, create, messages, profile
  activity/[id].tsx       Détail d'activité, participation, demandes (organisateur)
  profile/edit.tsx        Modification du profil
  settings.tsx            Liens légaux, déconnexion, suppression du compte
src/
  config/env.ts           URLs (EXPO_PUBLIC_*)
  constants/theme.ts      Design system : couleurs de la charte, espacements, typo
  components/ui/          Button, TextField, Avatar, Loading/Error/EmptyState
  components/             ActivityCard, SportIcon, SplashTransition
  context/                AuthContext (session), TerritoryContext (territoire actif)
  hooks/useAsync.ts       Chargement / erreur / rafraîchissement / annulation
  services/               Appels API typés (un fichier par domaine)
  storage/                Jeton dans SecureStore (Keychain / Keystore)
  lib/                    Fonctions pures testées : dates (Europe/Paris), libellés, validation
  types/                  Types alignés sur les réponses du backend
```

### Session et sécurité

- Le backend émet un **JWT Bearer valable 7 jours**, sans refresh token ni révocation.
- Le jeton est stocké dans **SecureStore** (jamais AsyncStorage), le mot de passe n'est jamais stocké.
- Au lancement, le jeton est revalidé par `GET /auth/me` ; un 401 l'efface.
- Tout 401 sur une requête authentifiée ferme la session (`setUnauthorizedHandler`) :
  les gardes renvoient au login avec le message « session expirée ».
- Déconnexion = suppression locale du jeton (le serveur ne gère pas de liste de révocation).
- Les contrôles d'accès restent côté serveur ; le mobile se contente de ne pas proposer
  une action impossible.

## Cartographie des API utilisées

| Écran | Méthode & route | Auth | Notes |
| --- | --- | --- | --- |
| Inscription | `GET /territories` | non | Territoires actifs |
| Inscription | `POST /auth/register` | non | `termsAccepted: true` obligatoire, rate-limit |
| Connexion | `POST /auth/login` | non | Rate-limit IP + email |
| Démarrage | `GET /auth/me` | oui | Revalidation du jeton |
| Mot de passe oublié | `POST /auth/forgot-password` | non | Lien reçu → page web de réinitialisation |
| Contexte | `GET /territories/mine` | oui | Territoire principal (`isDefault`) |
| Explorer / Accueil | `GET /sports` | non | Référentiel des sports |
| Explorer / Accueil | `GET /activities?territory=&sportId=&from=&participantId=` | non | `territory` obligatoire, **pas de pagination** |
| Détail | `GET /activities/:id` | oui | |
| Détail | `GET /activities/:id/my-participation` | oui | |
| Détail | `GET /activities/:id/participations` | oui | Créateur : toutes ; participant accepté : acceptées ; sinon 403 |
| Détail | `POST /activities/:id/join` | oui | Crée une demande `PENDING` |
| Détail | `DELETE /participations/:id` | oui | Annuler / se désinscrire |
| Modifier / annuler | `PATCH /activities/:id` | oui | Champs modifiés uniquement ; `status: CANCELLED` pour annuler |
| Supprimer | `DELETE /activities/:id` | oui | Supprime aussi demandes, discussion, photos |
| Messages | `GET /conversations/mine?territory=` | oui | Une discussion par activité + fils covoiturage |
| Discussion | `GET /activities/:id/conversation` · `GET`/`POST /conversations/:id/messages` | oui | Créée à la 1re ouverture ; territoire actif obligatoire |
| Mon territoire | `POST /territories/:code/join` | oui | Le territoire principal ne change pas |
| Créer | `POST /activities` | oui | `territoryId` du territoire actif ; date future revalidée serveur |
| Détail (organisateur) | `PUT /participations/:id/accept` · `/refuse` | oui | Capacité vérifiée côté serveur (`ACTIVITY_FULL`) |
| Profil | `GET /users/me/sports` · `GET /users/me/availabilities` | oui | |
| Modifier le profil | `PATCH /users/me` | oui | Champs vides → `null` |
| Paramètres | `DELETE /users/me` | oui | Suppression immédiate (cf. `AccountDeletionService`) |

Fichiers d'upload : chemins relatifs `/uploads/x` résolus sur `EXPO_PUBLIC_API_ORIGIN`.

## État d'avancement

Légende : ✅ fait et vérifié (typecheck + lint + tests + bundle) · 🧪 fait, à tester sur appareil · ⏳ à faire

| Fonctionnalité | État |
| --- | --- |
| Écran de démarrage + transition zoom logo | 🧪 |
| Inscription, connexion, déconnexion, mot de passe oublié | 🧪 |
| Expiration de session → retour au login | 🧪 |
| Accueil (mes prochaines activités, activités à venir) | 🧪 |
| Explorer par sport, détail, demande / annulation de participation | 🧪 |
| Organisateur : accepter / refuser les demandes | 🧪 |
| Profil (maquette : statistiques réelles, raccourcis), mes sports, mes participations / activités créées | 🧪 |
| Recherche : texte, sports, date, niveau, covoiturage (filtres d'affichage) | 🧪 |
| Thème par territoire (66 rouge/orange, 34 et 11 bleu nuit/or) + aperçu à l'inscription | 🧪 |
| Suppression du compte (double confirmation) | 🧪 |
| Création d'activité en 3 étapes (communes geo.api.gouv.fr, date/heure natives, heure de Paris) | 🧪 — requête validée sur l'API locale |
| Organisateur : modifier, annuler (statut « Annulée »), supprimer définitivement | 🧪 — cycle validé sur l'API locale |
| Carte des activités dans l'Explorer (bascule Liste / Carte) | 🧪 |
| Changer de territoire actif / rejoindre un territoire (profil) | 🧪 — adhésion validée sur l'API locale |
| Messagerie : liste, discussion de groupe et covoiturage, non-lus (REST, mise à jour toutes les 5 s) | 🧪 — parcours validé sur l'API locale |
| Gestion des sports, disponibilités, photo de profil | ⏳ |
| Profil public d'un autre membre | ⏳ |
| Notifications push natives | ⏳ — nécessite une évolution backend |

Tests automatisés : 35 tests unitaires (validation, dates Europe/Paris dont changement
d'heure, libellés, erreurs API, URLs médias). Aucun test sur appareil n'a encore été fait.

## Thèmes par territoire

`src/constants/brands.ts` : une palette par territoire (couleurs reprises de
`frontend/public/<code>partners/theme.json`) + son logo. `useBrand()` donne la
palette du territoire actif (ou du dernier utilisé avant connexion) ;
`useBrandStyles(makeStyles)` construit les styles qui en dépendent. Les couleurs
neutres restent dans `src/constants/theme.ts`.

## Points connus avant publication

- **Connexion Google** : `@react-native-google-signin/google-signin` (module natif) —
  ne fonctionne pas dans Expo Go, il faut un *development build* (`npx expo run:android`
  ou EAS). À créer dans Google Cloud (même projet que le site) : un client **Android**
  (package + empreinte SHA-1 du keystore debug et de celui du Play Store) et un client
  **iOS** (bundle id). Le backend reste inchangé : l'ID token est émis pour le client web.

- **Territoires 34 et 11** : activés en dev local, dans le seed et en production
  (31/10/2026, sauvegarde de la table sur le serveur). Staging public : à faire.
- **Messagerie — signalement et blocage** : exigés par Apple (règle 1.2) et Google pour
  les contenus entre utilisateurs ; absents du backend, à ajouter avant publication.
- **Messagerie — temps réel** : le site envoie par REST, qui ne diffuse rien en direct ;
  le mobile interroge donc le serveur toutes les 5 s quand une discussion est ouverte.
- **Carte (Android publié)** : Expo Go fonctionne sans clé ; un build Android
  nécessite une clé Google Maps (plugin `react-native-maps`, `androidGoogleMapsApiKey`).
  iOS utilise Apple Plans, sans clé.
- **Écran de démarrage** : la photo et l'écran natif sont ceux du 66 pour tous
  les territoires.

- **Icônes d'application** : `assets/images/icon.png` et les 3 icônes Android sont des
  carrés blancs vides — à remplacer par le logo (1024×1024, sans transparence pour iOS).
- **Identifiants de bundle** (`ios.bundleIdentifier`, `android.package`) non définis :
  définitifs une fois publiés, à choisir.
- **Pas d'EAS** configuré (`eas.json`, projectId).
- Écarts de versions *patch* Expo signalés par `expo-doctor` (`npx expo install --fix`).
