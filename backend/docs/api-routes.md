# API 66Partners — Documentation des routes

Base URL (dev) : `http://localhost:3000`
Toutes les routes métier sont préfixées par `/api`.

## Conventions

### Authentification

L'API est stateless : l'authentification se fait via un **JWT** transmis dans l'en-tête HTTP :

```
Authorization: Bearer <token>
```

Le token est renvoyé par `POST /api/auth/register` et `POST /api/auth/login`, valide 7 jours. Aucun cookie n'est utilisé (voir `backend/src/middlewares/auth.middleware.ts`).

### Format des réponses

Toutes les réponses sont au format JSON avec une enveloppe `success` :

```json
// Succès
{ "success": true, "message": "...", "...": "..." }

// Erreur
{ "success": false, "message": "Message d'erreur", "code": "CODE_ERREUR" }
```

Les erreurs de validation (Zod) renvoient en plus un tableau `errors` :

```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [{ "field": "email", "message": "Email invalide", "code": "invalid_string" }]
}
```

### Codes HTTP

| Code | Signification |
|---|---|
| 200 | Succès (lecture, mise à jour, suppression) |
| 201 | Ressource créée |
| 400 | Requête invalide / validation échouée |
| 401 | Non authentifié (token absent, invalide ou expiré) |
| 403 | Authentifié mais non autorisé (ex : pas le créateur de la ressource) |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex : email déjà utilisé, déjà inscrit à l'activité) |
| 500 | Erreur interne |

### Enums

| Enum | Valeurs |
|---|---|
| `sport_level` | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT` |
| `activities_status` | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `participation_status` | `PENDING`, `ACCEPTED`, `REFUSED` |

---

## Auth — `/api/auth`

### POST /api/auth/register

Inscription d'un nouvel utilisateur.

- **Authentification** : non requise

**Body**

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `pseudo` | string | oui | 1-100 caractères |
| `email` | string | oui | format email, max 255 |
| `password` | string | oui | 8-128 caractères |
| `city` | string | non | 1-100 caractères |
| `bio` | string | non | max 2000 caractères |
| `avatar` | string | non | URL valide, max 255 |

```json
{
  "pseudo": "alex66",
  "email": "alex@example.com",
  "password": "motdepasse123",
  "city": "Perpignan",
  "bio": "Aime le running et le padel",
  "avatar": "https://example.com/avatar.png"
}
```

**Réponse 201**

```json
{
  "success": true,
  "message": "Inscription réussie",
  "user": {
    "id": "uuid",
    "email": "alex@example.com",
    "pseudo": "alex66",
    "city": "Perpignan",
    "bio": "Aime le running et le padel",
    "avatar": "https://example.com/avatar.png",
    "createdAt": "2026-06-30T12:00:00.000Z"
  },
  "token": "eyJhbGciOi..."
}
```

**Erreurs** : `400` validation, `409 USER_ALREADY_EXISTS`

---

### POST /api/auth/login

Connexion.

- **Authentification** : non requise

**Body**

| Champ | Type | Requis |
|---|---|---|
| `email` | string | oui |
| `password` | string | oui |

**Réponse 200** : identique à `register` (`user` + `token`)

**Erreurs** : `401 INVALID_CREDENTIALS` (message volontairement vague)

---

### GET /api/auth/me

Profil de l'utilisateur authentifié.

- **Authentification** : requise

**Réponse 200**

```json
{ "success": true, "user": { "id": "uuid", "email": "...", "pseudo": "...", "city": null, "bio": null, "avatar": null, "createdAt": "..." } }
```

**Erreurs** : `401 UNAUTHENTICATED` / `401 INVALID_TOKEN`, `404 USER_NOT_FOUND`

---

## Users — `/api/users`

### GET /api/users/me

Profil complet de l'utilisateur authentifié.

- **Authentification** : requise

**Réponse 200**

```json
{
  "success": true,
  "user": {
    "id": "uuid", "email": "...", "pseudo": "...", "city": null, "bio": null,
    "avatar": null, "latitude": null, "longitude": null,
    "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### PATCH /api/users/me

Mise à jour du profil de l'utilisateur authentifié. Tous les champs sont optionnels (au moins un requis) ; `city`, `bio`, `avatar`, `latitude`, `longitude` acceptent `null` pour effacer la valeur.

- **Authentification** : requise

**Body** (tous optionnels)

| Champ | Type |
|---|---|
| `pseudo` | string (1-100) |
| `city` | string (1-100) \| `null` |
| `bio` | string (max 2000) \| `null` |
| `avatar` | string (URL) \| `null` |
| `latitude` | number (-90 à 90) \| `null` |
| `longitude` | number (-180 à 180) \| `null` |

**Réponse 200** : `{ success, message: "Profil mis à jour", user }`

**Erreurs** : `400` (corps vide ou invalide), `404 USER_NOT_FOUND`

---

### DELETE /api/users/me

Suppression du compte de l'utilisateur authentifié.

- **Authentification** : requise

**Réponse 200** : `{ success: true, message: "Compte supprimé" }`

**Erreurs** : `404 USER_NOT_FOUND`

---

### GET /api/users/me/sports

Liste des sports pratiqués par l'utilisateur authentifié, avec leur niveau.

- **Authentification** : requise

**Réponse 200**

```json
{
  "success": true,
  "sports": [
    { "sportId": "uuid", "sportName": "Football", "level": "INTERMEDIATE" }
  ]
}
```

---

### PUT /api/users/me/sports

Ajoute un sport au profil de l'utilisateur (ou met à jour son niveau s'il le pratique déjà — upsert).

- **Authentification** : requise

**Body**

| Champ | Type | Requis |
|---|---|---|
| `sportId` | string (uuid) | oui |
| `level` | `sport_level` | oui |

**Réponse 200** : `{ success, message: "Sport mis à jour", sport: { sportId, sportName, level } }`

**Erreurs** : `400` validation, `404 SPORT_NOT_FOUND`

---

### DELETE /api/users/me/sports/:sportId

Retire un sport du profil de l'utilisateur authentifié.

- **Authentification** : requise

**Réponse 200** : `{ success: true, message: "Sport retiré" }`

**Erreurs** : `404 USER_SPORT_NOT_FOUND`

---

### GET /api/users/:id

Profil public d'un utilisateur.

- **Authentification** : non requise

**Réponse 200** : `{ success, user }` (même forme que `GET /api/users/me`)

**Erreurs** : `400 MISSING_USER_ID`, `404 USER_NOT_FOUND`

---

### GET /api/users/:id/sports

Sports pratiqués par un utilisateur donné (profil public).

- **Authentification** : non requise

**Réponse 200** : identique à `GET /api/users/me/sports`

---

## Sports — `/api/sports`

### GET /api/sports

Liste de tous les sports (référentiel).

- **Authentification** : non requise

**Réponse 200**

```json
{ "success": true, "sports": [{ "id": "uuid", "name": "Football", "createdAt": "..." }] }
```

---

### GET /api/sports/:id

- **Authentification** : non requise
- **Réponse 200** : `{ success, sport }`
- **Erreurs** : `404 SPORT_NOT_FOUND`

---

### POST /api/sports

Création d'un sport.

- **Authentification** : requise *(pas de notion d'admin/rôle dans le schéma actuel — tout utilisateur connecté peut créer un sport)*

**Body**

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `name` | string | oui | 1-100 caractères, unique |

**Réponse 201** : `{ success, message: "Sport créé", sport }`

**Erreurs** : `409 SPORT_ALREADY_EXISTS`

---

### PATCH /api/sports/:id

- **Authentification** : requise
- **Body** : `{ name? }`
- **Réponse 200** : `{ success, message: "Sport mis à jour", sport }`
- **Erreurs** : `404 SPORT_NOT_FOUND`

---

### DELETE /api/sports/:id

- **Authentification** : requise
- **Réponse 200** : `{ success: true, message: "Sport supprimé" }`
- **Erreurs** : `404 SPORT_NOT_FOUND`

---

## Activities — `/api/activities`

### GET /api/activities

Liste des activités, avec filtres optionnels en query string.

- **Authentification** : non requise

**Query params** (tous optionnels)

| Param | Type |
|---|---|
| `city` | string |
| `sportId` | uuid |
| `status` | `activities_status` |

**Réponse 200**

```json
{
  "success": true,
  "activities": [
    {
      "id": "uuid", "title": "Sortie running", "description": null, "city": "Perpignan",
      "startDate": "2026-07-10T08:00:00.000Z", "latitude": null, "longitude": null,
      "levelRequired": "BEGINNER", "maxParticipants": 8, "status": "PENDING",
      "sportId": "uuid", "creatorId": "uuid", "createdAt": "...", "updatedAt": "..."
    }
  ]
}
```

---

### GET /api/activities/:id

- **Authentification** : non requise
- **Réponse 200** : `{ success, activity }`
- **Erreurs** : `404 ACTIVITY_NOT_FOUND`

---

### POST /api/activities

Création d'une activité.

- **Authentification** : requise

**Body**

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `title` | string | oui | 1-150 caractères |
| `description` | string | non | max 2000 |
| `city` | string | oui | 1-100 caractères |
| `startDate` | string (ISO date) | oui | doit être dans le futur |
| `latitude` | number | non | -90 à 90 |
| `longitude` | number | non | -180 à 180 |
| `levelRequired` | `sport_level` | oui | |
| `maxParticipants` | integer | oui | > 1 |
| `sportId` | string (uuid) | oui | doit exister |

**Réponse 201** : `{ success, message: "Activité créée", activity }` (`creatorId` = utilisateur authentifié)

**Erreurs** : `400` validation (dont date passée, `maxParticipants` ≤ 1)

---

### PATCH /api/activities/:id

Mise à jour d'une activité — **réservé au créateur**.

- **Authentification** : requise

**Body** : mêmes champs que la création, tous optionnels, + `status` (`activities_status`)

**Réponse 200** : `{ success, message: "Activité mise à jour", activity }`

**Erreurs** : `403 FORBIDDEN` (pas le créateur), `404 ACTIVITY_NOT_FOUND`

---

### DELETE /api/activities/:id

Suppression — **réservé au créateur**.

- **Authentification** : requise

**Réponse 200** : `{ success: true, message: "Activité supprimée" }`

**Erreurs** : `403 FORBIDDEN`, `404 ACTIVITY_NOT_FOUND`

---

### POST /api/activities/:id/join

Demande pour rejoindre une activité (crée une `participation` au statut `PENDING`).

- **Authentification** : requise

**Réponse 201**

```json
{
  "success": true,
  "message": "Demande de participation envoyée",
  "participation": { "id": "uuid", "userId": "uuid", "activityId": "uuid", "status": "PENDING", "createdAt": "..." }
}
```

**Erreurs** :
- `403 CANNOT_JOIN_OWN_ACTIVITY` — un créateur ne peut pas rejoindre sa propre activité
- `409 ALREADY_REQUESTED` — demande déjà existante pour cet utilisateur/activité
- `404 ACTIVITY_NOT_FOUND`

---

## Participations — `/api/participations`

### PUT /api/participations/:id/accept

Accepte une demande de participation — **réservé au créateur de l'activité concernée**.

- **Authentification** : requise

**Réponse 200** : `{ success, message: "Demande de participation acceptée", participation }`

**Erreurs** :
- `403 FORBIDDEN` — pas le créateur de l'activité
- `404 PARTICIPATION_NOT_FOUND`
- `409 ACTIVITY_FULL` — nombre maximum de participants acceptés déjà atteint

---

### PUT /api/participations/:id/refuse

Refuse une demande de participation — **réservé au créateur de l'activité concernée**.

- **Authentification** : requise

**Réponse 200** : `{ success, message: "Demande de participation refusée", participation }`

**Erreurs** : `403 FORBIDDEN`, `404 PARTICIPATION_NOT_FOUND`

---

### DELETE /api/participations/:id

Annule une demande de participation — **réservé à l'auteur de la demande**.

- **Authentification** : requise

**Réponse 200** : `{ success: true, message: "Demande de participation annulée" }`

**Erreurs** : `403 FORBIDDEN` (pas l'auteur de la demande), `404 PARTICIPATION_NOT_FOUND`

---

## Divers

### GET /api/health

Vérification de l'état de l'API (non documentée plus haut, utile pour le monitoring/Docker healthcheck).

- **Authentification** : non requise
- **Réponse 200** : `{ "status": "ok", "timestamp": "...", "environment": "development" }`

### Route non trouvée

Toute route non définie renvoie :

```json
{ "success": false, "message": "Route non trouvée : GET /api/xxx", "code": "ROUTE_NOT_FOUND" }
```

(HTTP 404 — voir `backend/src/middlewares/error.middleware.ts`)
