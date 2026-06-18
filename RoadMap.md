# Phase 1 — Cadrage MVP

## Objectif : sortir une première version simple.

### Fonctionnalités MVP :

* inscription / connexion auth
* profil sportif
* liste des sports
* création d’une sortie
* recherche de sorties autour de soi
* demande de participation
* messagerie simple
* notation après sortie

### Stack conseillée :

* Backend : Node.js, Express
* Base de données : PostgreSQL
* ORM : Prisma
* Auth : JWT + refresh token
* Front web : React + Vite
* UI : SCSS , à voir Bootstrap 
* Maps : Mapbox ou Google Maps
* Déploiement : Render / Railway / Fly.io

### Phase 2 — Architecture backend

#### **Structure Express :**

# Structure du backend

```txt
backend/
└── src/
    ├── config/
    │   ├── database.ts
    │   ├── env.ts
    │   ├── logger.ts
    │   └── socket.ts
    │
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── activity.controller.ts
    │   ├── participation.controller.ts
    │   ├── message.controller.ts
    │   ├── review.controller.ts
    │   └── notification.controller.ts
    │
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   ├── validation.middleware.ts
    │   ├── rateLimiter.middleware.ts
    │   └── upload.middleware.ts
    │
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── activity.routes.ts
    │   ├── participation.routes.ts
    │   ├── message.routes.ts
    │   ├── review.routes.ts
    │   ├── notification.routes.ts
    │   └── index.ts
    │
    ├── services/
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── activity.service.ts
    │   ├── participation.service.ts
    │   ├── message.service.ts
    │   ├── review.service.ts
    │   ├── notification.service.ts
    │   └── email.service.ts
    │
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    │
    ├── validations/
    │   ├── auth.validation.ts
    │   ├── user.validation.ts
    │   ├── activity.validation.ts
    │   └── review.validation.ts
    │
    ├── types/
    │   ├── auth.types.ts
    │   ├── user.types.ts
    │   ├── activity.types.ts
    │   └── api.types.ts
    │
    ├── utils/
    │   ├── jwt.ts
    │   ├── bcrypt.ts
    │   ├── pagination.ts
    │   ├── geo.ts
    │   ├── date.ts
    │   └── response.ts
    │
    ├── app.ts
    └── server.ts

.env
.env.example
package.json
tsconfig.json
```

#### **Modules principaux :**

* auth
* users
* sports
* activities
* participations
* messages
* reviews
* notifications

#### **Modèles principaux :**

* User
* Sport
* UserSport
* Activity
* Participation
* Message
* Review
* Notification

#### **Endpoints MVP :**

***Auth***
- POST /auth/register
- POST /auth/login
- GET /me
- PUT /me/profile

***Sports***

- GET /sports

***Activities***

- POST /activities
- GET /activities
- GET /activities/:id
- PUT /activities/:id
- DELETE /activities/:id

- POST /activities/:id/join
- PUT /participations/:id/accept
- PUT /participations/:id/refuse

***Messages***

- GET /conversations
- GET /conversations/:id/messages
- POST /conversations/:id/messages

***Reviews***

- POST /reviews

### **Phase 3 — Base de données**

* PostgreSQL + Prisma.


### **MCD**
Relations importantes :

- un utilisateur peut pratiquer plusieurs sports
- une sortie appartient à un créateur
- une sortie a plusieurs participants
- une sortie a un lieu de départ
- une conversation est liée à une sortie
- un avis est lié à une sortie


### Phase 4 — Front React web

***Pages à créer :***

- /login
- /register
- /onboarding
- /home
- /activities
- /activities/:id
- /create-activity
- /profile
- /messages
- /messages/:id



### Librairies utiles :

React Router
TanStack Query ?
React Hook Form
Zod
Axios
Zustand

### Phase 5 — Parcours utilisateur
Nouveau compte
L’utilisateur s’inscrit.
Il choisit ses sports.
Il indique son niveau.
Il indique sa ville ou sa position.
Il arrive sur les sorties proches.
Création de sortie
Sport
Date / heure
Lieu de départ
Niveau attendu
Description
Nombre max de participants
Participation
L’utilisateur demande à rejoindre.
L’organisateur accepte ou refuse.
Le chat s’ouvre.
Après la sortie, chacun peut laisser un avis.

### **Phase 6 — Développement par sprints**

#### Sprint 1 — Setup
- repo GitHub
- backend Express
- frontend React
- PostgreSQL
- Prisma
- architecture propre

### Sprint 2 — Auth
* register
* login
* JWT
* middleware auth
* page connexion
* page inscription

### **Sprint 3 — Profil sportif**
* onboarding
* choix des sports
* niveaux
* édition du profil

## **Sprint 4 — Sorties**
- création sortie
- liste des sorties
- détail sortie
- filtres sport / ville / niveau
- Sprint 5 — Participations
- demander à rejoindre
- accepter / refuser
- afficher les participants

### **Sprint 6 — Messagerie**
* conversation par sortie
* messages texte
* temps réel avec Socket.io

### **Sprint 7 — Avis**
- note utilisateur
- commentaire
- score de fiabilité

### **Sprint 8 — Polish MVP**
- responsive mobile
- erreurs propres
- loading states
- notifications email simples
- déploiement (railway?)

### **Phase 7 — Passage React Native**

Quand l’API est stable, passer sur mobile.

***Structure :***

# Structure du projet mobile

```txt
mobile/
└── src/
    ├── screens/
    │   ├── Auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   │
    │   ├── Home/
    │   │   ├── HomeScreen.tsx
    │   │   └── SearchScreen.tsx
    │   │
    │   ├── Activities/
    │   │   ├── ActivitiesScreen.tsx
    │   │   ├── ActivityDetailsScreen.tsx
    │   │   ├── CreateActivityScreen.tsx
    │   │   └── EditActivityScreen.tsx
    │   │
    │   ├── Profile/
    │   │   ├── ProfileScreen.tsx
    │   │   ├── EditProfileScreen.tsx
    │   │   └── UserReviewsScreen.tsx
    │   │
    │   ├── Messages/
    │   │   ├── ConversationsScreen.tsx
    │   │   └── ChatScreen.tsx
    │   │
    │   └── Settings/
    │       └── SettingsScreen.tsx
    │
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Loader.tsx
    │   │   ├── Avatar.tsx
    │   │   └── EmptyState.tsx
    │   │
    │   ├── activity/
    │   │   ├── ActivityCard.tsx
    │   │   ├── ActivityList.tsx
    │   │   ├── ActivityFilters.tsx
    │   │   └── CreateActivityForm.tsx
    │   │
    │   ├── profile/
    │   │   ├── ProfileHeader.tsx
    │   │   ├── UserStats.tsx
    │   │   └── ReviewCard.tsx
    │   │
    │   └── chat/
    │       ├── ChatBubble.tsx
    │       ├── ChatInput.tsx
    │       └── ConversationItem.tsx
    │
    ├── navigation/
    │   ├── AppNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx
    │   └── types.ts
    │
    ├── services/
    │   ├── api/
    │   │   ├── axios.ts
    │   │   ├── auth.service.ts
    │   │   ├── activity.service.ts
    │   │   ├── profile.service.ts
    │   │   └── message.service.ts
    │   │
    │   ├── socket/
    │   │   └── socket.ts
    │   │
    │   └── storage/
    │       ├── secureStorage.ts
    │       └── localStorage.ts
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useActivities.ts
    │   ├── useMessages.ts
    │   ├── useLocation.ts
    │   └── useProfile.ts
    │
    ├── store/
    │   ├── auth.store.ts
    │   ├── activity.store.ts
    │   ├── message.store.ts
    │   └── app.store.ts
    │
    ├── types/
    │   ├── user.types.ts
    │   ├── activity.types.ts
    │   ├── message.types.ts
    │   └── api.types.ts
    │
    ├── constants/
    │   ├── colors.ts
    │   ├── routes.ts
    │   ├── sports.ts
    │   └── config.ts
    │
    ├── utils/
    │   ├── date.ts
    │   ├── location.ts
    │   ├── validation.ts
    │   └── helpers.ts
    │
    └── assets/
        ├── images/
        ├── icons/
        └── fonts/
```

À réutiliser :

* logique API
* types TypeScript
* validation Zod
* design system
* auth flow

Fonctionnalités mobiles prioritaires :

* géolocalisation
* notifications push
* carte
* création rapide de sortie
* chat mobile
* profil utilisateur


### Stack mobile :

* React Native avec Expo
* Expo Router
* React Native Maps
* Expo Location
* Expo Notifications
* TanStack Query?
* Zustand
