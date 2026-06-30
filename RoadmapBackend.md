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
npm install drizzle-orm pg
npm install zod argon2 jsonwebtoken
```

Installer les dépendances dev :

```bash
npm install -D typescript tsx nodemon drizzle-kit @types/node @types/express @types/cors @types/pg @types/jsonwebtoken
```

Initialiser TypeScript :

```bash
npx tsc --init
```

Créer `drizzle.config.ts` à la racine du backend :

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## Étape 2 — Créer l’arborescence backend

```txt
backend/
└── src/
    ├── config/
    │   ├── env.ts
    │   └── Drizzle.ts
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
    │   ├── argon2.ts
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

## Étape 4 — Configurer Drizzle + PostgreSQL

### `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/66partners"
JWT_SECRET="secret_dev"
PORT=3000
```

### Schéma Drizzle MVP V1 (`src/db/schema.ts`)

```ts
import {
  pgTable, uuid, varchar, text, timestamp, integer, pgEnum, unique, primaryKey,
} from "drizzle-orm/pg-core";

export const sportLevelEnum = pgEnum("sport_level", ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);
export const participationStatusEnum = pgEnum("participation_status", ["PENDING", "ACCEPTED", "REFUSED"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  pseudo: varchar("pseudo", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  bio: text("bio"),
  avatar: varchar("avatar", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sports = pgTable("sports", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSports = pgTable("user_sports", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportId: uuid("sport_id").notNull().references(() => sports.id, { onDelete: "cascade" }),
  level: sportLevelEnum("level").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.sportId] }),
}));

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 100 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  levelRequired: sportLevelEnum("level_required").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  sportId: uuid("sport_id").notNull().references(() => sports.id),
  creatorId: uuid("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const participations = pgTable("participations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  status: participationStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueUserActivity: unique().on(t.userId, t.activityId),
}));
```

Puis :

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Étape 5 — Seed des sports

Créer un fichier `src/db/seed.ts` qui insère les sports via `db.insert(sports).values([...])`.

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
npx tsx src/db/seed.ts
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
- hash du mot de passe avec Argon2
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
- gestion des erreurs Drizzle

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
- migrations Drizzle OK
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
3. Express + Drizzle
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