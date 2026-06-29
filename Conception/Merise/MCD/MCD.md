## X-1. MCD (Modèle Conceptuel de Données)

### User

- id (PK)
- email (unique)
- password (hashé, Argon2)
- pseudo (unique)
- city
- bio
- avatar
- location (point géographique)
- role (`user` | `admin`)
- isSuspended (bool, défaut: false)
- createdAt
- updatedAt

### Sport

- id (PK)
- name (unique)

### UserSport

- id (PK)
- userId (FK → User)
- sportId (FK → Sport)
- level (`débutant` | `intermédiaire` | `avancé` | `expert`)
- createdAt

> Contrainte : unicité sur (userId, sportId) — un utilisateur ne peut avoir qu'un seul niveau par sport.

### Activity

- id (PK)
- title
- description
- city
- location (point géographique)
- startDate
- levelRequired (`débutant` | `intermédiaire` | `avancé` | `expert`)
- maxParticipants
- status (`active` | `cancelled` | `completed`)
- creatorId (FK → User)
- sportId (FK → Sport)
- createdAt
- updatedAt

### Participation

- id (PK)
- userId (FK → User)
- activityId (FK → Activity)
- status (`pending` | `accepted` | `refused` | `cancelled`)
- createdAt
- updatedAt

> Contrainte : unicité sur (userId, activityId) — une participation unique par utilisateur et par activité.

### Conversation

- id (PK)
- activityId (FK → Activity, nullable — conversation liée ou non à une activité)
- createdAt

### ConversationParticipant

- id (PK)
- conversationId (FK → Conversation)
- userId (FK → User)

### Message

- id (PK)
- conversationId (FK → Conversation)
- senderId (FK → User)
- content
- createdAt

### Review

- id (PK)
- authorId (FK → User) — celui qui rédige l'avis
- targetUserId (FK → User) — celui qui reçoit l'avis
- activityId (FK → Activity) — activité commune ayant justifié l'avis
- rating (entier, 1 à 5)
- comment
- createdAt

> Contrainte : unicité sur (authorId, targetUserId, activityId) — un seul avis par activité commune.

### Notification

- id (PK)
- userId (FK → User) — destinataire
- type (`match_request` | `new_participant` | `participation_accepted` | `participation_refused` | `new_message` | `new_review` | `activity_cancelled`)
- relatedId (id de l'entité concernée : activityId, participationId, messageId...)
- content
- isRead (bool, défaut: false)
- createdAt

---

## Relations principales

- Un **User** peut pratiquer plusieurs **Sport** via **UserSport** (niveau par sport)
- Un **User** peut créer plusieurs **Activity** (1-N, via `creatorId`)
- Une **Activity** appartient à un seul **Sport** (N-1)
- Un **User** peut avoir plusieurs **Participation** à différentes activités (N-N entre User et Activity, via la table de jonction Participation)
- Une **Activity** peut avoir une **Conversation** associée, elle-même liée à plusieurs **User** via **ConversationParticipant**
- Une **Conversation** contient plusieurs **Message**
- Un **User** peut rédiger plusieurs **Review** sur d'autres utilisateurs, toujours rattachés à une **Activity** commune
- Un **User** reçoit plusieurs **Notification**

---

## X-2. MLD (Modèle Logique de Données)

```
User (id, email, password, pseudo, city, bio, avatar, location, role, isSuspended, createdAt, updatedAt)

Sport (id, name)

UserSport (id, #userId, #sportId, level, createdAt)

Activity (id, title, description, city, location, startDate, levelRequired, maxParticipants, status, #creatorId, #sportId, createdAt, updatedAt)

Participation (id, #userId, #activityId, status, createdAt, updatedAt)

Conversation (id, #activityId, createdAt)

ConversationParticipant (id, #conversationId, #userId)

Message (id, #conversationId, #senderId, content, createdAt)

Review (id, #authorId, #targetUserId, #activityId, rating, comment, createdAt)

Notification (id, #userId, type, relatedId, content, isRead, createdAt)
```

(`#` désigne une clé étrangère)

---

## X-3. MPD (Modèle Physique de Données)

Voir le schéma complet en annexe : `../ERD/erd-v2.png`

Points d'attention pour l'implémentation Prisma :

- Le champ `location` (User et Activity) doit être stocké en type géographique PostGIS (`geography(Point, 4326)`). Prisma ne supportant pas nativement ce type, prévoir soit une extension (`prisma-extension-postgis`), soit la création de la colonne via une migration SQL brute (`ALTER TABLE ... ADD COLUMN location geography(Point, 4326)`), avec un index spatial `GIST` associé pour les requêtes `ST_DWithin`.
- Les enums (`level`, `status`, `role`, `type` de notification) doivent être déclarés comme `enum` Prisma plutôt que de simples chaînes, pour garantir l'intégrité des données.
- Index recommandés : `Activity.startDate`, `Activity.sportId`, `Notification.userId + isRead`, `Participation.activityId + userId` (composite, déjà couvert par la contrainte d'unicité).