# Roadmap Backend MVP V1 — 66Partners

Objectif : créer une API simple permettant à un utilisateur de s’inscrire, renseigner ses sports, créer une activité et gérer les demandes de participation.

---

## Étape 1 — Initialisation du backend

### Objectif

Mettre en place une base propre pour l’API.

### À faire

```bash
mkdir backend
cd backend
npm init -y
```

Installer les dépendances :

```bash
npm install express cors helmet dotenv
npm install prisma @prisma/client
npm install zod bcrypt jsonwebtoken
```

Installer les dépendances dev :

```bash
npm install -D typescript tsx nodemon @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken
```

Initialiser TypeScript :

```bash
npx tsc --init
```

Initialiser Prisma :

```bash
npx prisma init
```

---

## Étape 2 — Créer l’arborescence backend

```txt
backend/
└── src/
    ├── config/
    │   ├── env.ts
    │   └── prisma.ts
    │
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── sport.controller.ts
    │   ├── activity.controller.ts
    │   └── participation.controller.ts
    │
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   └── validation.middleware.ts
    │
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── sport.routes.ts
    │   ├── activity.routes.ts
    │   ├── participation.routes.ts
    │   └── index.ts
    │
    ├── services/
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── sport.service.ts
    │   ├── activity.service.ts
    │   └── participation.service.ts
    │
    ├── validations/
    │   ├── auth.validation.ts
    │   ├── user.validation.ts
    │   ├── activity.validation.ts
    │   └── participation.validation.ts
    │
    ├── utils/
    │   ├── jwt.ts
    │   ├── bcrypt.ts
    │   └── response.ts
    │
    ├── app.ts
    └── server.ts
```

---

## Étape 3 — Configurer Express

### `src/app.ts`

À mettre en place :

- express
- cors
- helmet
- JSON parser
- routes
- middleware d’erreur

### `src/server.ts`

À mettre en place :

- démarrage serveur
- port depuis `.env`

---

## Étape 4 — Configurer Prisma + PostgreSQL

### `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/66partners"
JWT_SECRET="secret_dev"
PORT=3000
```

### Modèles Prisma MVP V1

```prisma
model User {
  id             String          @id @default(uuid())
  email          String          @unique
  password       String
  pseudo         String
  city           String?
  bio            String?
  avatar         String?

  sports         UserSport[]
  activities     Activity[]
  participations Participation[]

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Sport {
  id        String      @id @default(uuid())
  name      String      @unique

  users     UserSport[]
  activities Activity[]

  createdAt DateTime    @default(now())
}

model UserSport {
  userId  String
  sportId String
  level   SportLevel

  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  sport   Sport  @relation(fields: [sportId], references: [id], onDelete: Cascade)

  @@id([userId, sportId])
}

model Activity {
  id              String          @id @default(uuid())
  title           String
  description     String?
  city            String
  startDate       DateTime
  levelRequired   SportLevel
  maxParticipants Int

  sportId         String
  sport           Sport           @relation(fields: [sportId], references: [id])

  creatorId       String
  creator         User            @relation(fields: [creatorId], references: [id])

  participations  Participation[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Participation {
  id         String              @id @default(uuid())
  userId     String
  activityId String
  status     ParticipationStatus @default(PENDING)

  user       User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  activity   Activity            @relation(fields: [activityId], references: [id], onDelete: Cascade)

  createdAt  DateTime            @default(now())

  @@unique([userId, activityId])
}

enum SportLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum ParticipationStatus {
  PENDING
  ACCEPTED
  REFUSED
}
```

Puis :

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Étape 5 — Seed des sports

Créer un fichier `prisma/seed.ts`.

Sports à ajouter :

```txt
Vélo route
VTT
Running
Trail
Padel
Tennis
Badminton
Randonnée
```

Commande :

```bash
npx prisma db seed
```

---

## Étape 6 — Authentification

### Routes

```txt
POST /auth/register
POST /auth/login
GET /auth/me
```

### À faire

- validation Zod
- hash du mot de passe avec bcrypt
- génération JWT
- middleware `auth`
- récupération utilisateur connecté

### Règles

- email unique
- mot de passe hashé
- ne jamais retourner le password dans les réponses API

---

## Étape 7 — Profil utilisateur

### Routes

```txt
GET /users/me
PUT /users/me
PUT /users/me/sports
```

### À faire

- modifier pseudo
- modifier ville
- modifier bio
- modifier avatar
- ajouter / mettre à jour les sports pratiqués
- renseigner le niveau par sport

---

## Étape 8 — Sports

### Routes

```txt
GET /sports
```

### À faire

- retourner la liste des sports disponibles
- utiliser le seed comme source initiale

---

## Étape 9 — Activités sportives

### Routes

```txt
POST /activities
GET /activities
GET /activities/:id
PUT /activities/:id
DELETE /activities/:id
```

### Filtres MVP

```txt
?sportId=
?city=
?date=
?levelRequired=
```

### Règles métier

- seul un utilisateur connecté peut créer une activité
- seul le créateur peut modifier une activité
- seul le créateur peut supprimer une activité
- une activité doit avoir une date future
- `maxParticipants` doit être supérieur à 1

---

## Étape 10 — Participations

### Routes

```txt
POST /activities/:id/join
PUT /participations/:id/accept
PUT /participations/:id/refuse
DELETE /participations/:id
```

### Règles métier

- un utilisateur ne peut pas rejoindre sa propre activité
- un utilisateur ne peut pas demander deux fois à rejoindre la même activité
- seul le créateur de l’activité peut accepter ou refuser
- une activité ne peut pas dépasser le nombre maximum de participants acceptés
- un utilisateur peut annuler sa demande

---

## Étape 11 — Gestion des erreurs

Créer des réponses homogènes :

```json
{
  "success": false,
  "message": "Message d'erreur"
}
```

Succès :

```json
{
  "success": true,
  "data": {}
}
```

Erreurs à gérer :

- 400 : mauvaise requête
- 401 : non authentifié
- 403 : interdit
- 404 : ressource introuvable
- 409 : conflit
- 500 : erreur serveur

---

## Étape 12 — Tests API manuels

Tester avec Postman, Insomnia ou Thunder Client.

Ordre de test :

```txt
1. Register
2. Login
3. Me
4. Update profile
5. Get sports
6. Create activity
7. Get activities
8. Join activity
9. Accept participation
10. Refuse participation
```

---

## Étape 13 — Sécurité MVP

À mettre en place dès la V1 :

- Helmet
- CORS configuré
- hash password
- JWT secret dans `.env`
- validation Zod
- protection des routes privées
- suppression du password dans les réponses
- gestion des erreurs Prisma

---

## Étape 14 — Documentation API

Créer un fichier :

```txt
docs/api-routes.md
```

Documenter :

- route
- méthode HTTP
- body attendu
- réponse attendue
- besoin d’authentification ou non

---

## Étape 15 — Déploiement backend MVP

Checklist :

- `.env.example`
- Dockerfile backend
- docker-compose avec PostgreSQL
- migrations Prisma OK
- seed des sports OK
- API accessible sur `/health`

Route utile :

```txt
GET /health
```

Réponse :

```json
{
  "success": true,
  "message": "API 66Partners is running"
}
```

---

# Ordre exact recommandé

```txt
1. Initialisation backend
2. Structure dossiers
3. Express + Prisma
4. Modèles User / Sport / UserSport / Activity / Participation
5. Migration database
6. Seed sports
7. Auth
8. Profil utilisateur
9. Sports
10. Activités
11. Participations
12. Erreurs globales
13. Tests API
14. Documentation
15. Docker / Déploiement
```

---

# Backend MVP terminé quand

- un utilisateur peut créer un compte ;
- il peut se connecter ;
- il peut modifier son profil sportif ;
- il peut consulter les sports ;
- il peut créer une activité ;
- un autre utilisateur peut demander à participer ;
- l’organisateur peut accepter ou refuser.