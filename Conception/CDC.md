# <br><p align="center">Cahier des Charges - ***66Partners***</p>

<p align="center">
  <img src="./Maquettes/exemplelogo.png" alt="Logo 66Partners" width="500" />
</p>

---

# <p align="center">SOMMAIRE</p>

## I. Présentation 👋

## II. Fonctionnalités du projet ⚙️

### II-1. MVP (Minimum Viable Product)

- Gestion des comptes utilisateurs
- Gestion des profils sportifs
- Gestion des sports
- Gestion des activités sportives
- Gestion des participations

### II-2. Version 1.1

#### Communication

- Messagerie entre participants

#### Système communautaire

- Avis et notation des utilisateurs
- Score de fiabilité

## III. Évolutions potentielles ↗️

### III-1. Version 2.0

- Application mobile React Native
- Intégration Strava
- Groupes sportifs
- Système Premium
- Suggestions intelligentes de partenaires

## IV. Architecture du projet 🏗️

## V. Technologies utilisées 🛠️

### V-1. Backend

- Runtime & Framework
- Infrastructure & Déploiement

### V-2. Base de données

### V-3. Frontend

- Framework & Build

## VI. Authentification & Sécurité 👮

### VI-1. Authentification

### VI-2. Validation & Sécurité

### VI-3. Qualité & Tests

## VII. Cible 🎯

### VII-1. Utilisateurs visés

### VII-2. Navigateurs compatibles

## VIII. Architecture fonctionnelle 🌳

## IX. Routes de l'application 🛣️

### IX-1. Authentification

### IX-2. Gestion utilisateur

### IX-3. Activités sportives

### IX-4. Participations

### IX-5. Messagerie

### IX-6. Avis & Notations

## X. User Stories 👥

### Rôle : Visiteur

### Rôle : Utilisateur

### Rôle : Administrateur

## XI. Modèle de données 🗄️

### MCD

### MLD

### MPD

## XII. Analyse des risques ⚠️

### Infrastructure

### Base de données

### Sécurité

### Services tiers

## XIII. RGPD ⚖️

### Inventaire des données

### Consentement

### Droit à l'oubli

### Export des données

### Sécurité des données

## XIV. Documents de conception 📄

### Diagrammes UML

### Diagrammes de séquence

### Cas d'utilisation (Use Cases)

---

# I. Présentation 👋

## Contexte

La pratique sportive est souvent freinée par une difficulté récurrente : trouver des partenaires ayant le même niveau, les mêmes disponibilités ou pratiquant la même activité.

Dans les Pyrénées-Orientales, de nombreux sportifs pratiquent régulièrement des activités telles que le vélo, le padel, le tennis, le trail ou encore la randonnée, mais peinent parfois à constituer un groupe ou à trouver un partenaire rapidement.

**66Partners** a pour objectif de répondre à ce besoin en proposant une plateforme locale de mise en relation sportive.

---

## Présentation du projet

**66Partners** est une plateforme web permettant aux habitants des Pyrénées-Orientales de trouver facilement des partenaires de sport selon :

- leur localisation ;
- leur niveau ;
- leurs disponibilités ;
- leur discipline sportive.

L'application vise à favoriser la pratique sportive locale tout en développant une dimension sociale basée sur la confiance et le partage.

---

## Objectifs du projet

Les objectifs principaux sont :

- Faciliter la mise en relation entre sportifs.
- Encourager la pratique régulière du sport.
- Créer une communauté sportive locale.
- Permettre l'organisation rapide de sorties sportives.
- Offrir une expérience simple et intuitive.

---

## Zone géographique

Le lancement du projet est prévu exclusivement dans le département des **Pyrénées-Orientales (66)**.

Cette approche permet :

- de concentrer les efforts de communication ;
- d'obtenir une masse critique d'utilisateurs plus rapidement ;
- de valider le modèle économique avant une éventuelle extension régionale ou nationale.

---

## Sports concernés au lancement

### Sports individuels ou semi-collectifs

- Vélo de route
- VTT
- Running
- Trail
- Tennis
- Padel
- Badminton
- Randonnée

### Évolutions futures

- Escalade
- Surf
- Kitesurf
- Natation
- Sports collectifs

---

# II. Fonctionnalités du projet ⚙️

## II-1. MVP (Minimum Viable Product)

L'objectif du MVP est de valider l'intérêt du marché et de permettre aux utilisateurs de trouver rapidement un partenaire sportif.

### Gestion des comptes

- Création de compte
- Connexion (mail)
- Déconnexion
- Réinitialisation du mot de passe
- Modification du profil

### Gestion du profil sportif

- Photo de profil
- Description
- Sports pratiqués
- Niveau sportif
- Ville de résidence
- Disponibilités

### Gestion des activités sportives

- Création d'une activité
- Modification d'une activité
- Suppression d'une activité
- Consultation des activités disponibles

### Recherche et filtrage

Recherche selon :

- Sport
- Niveau
- Date
- Distance
- Localisation

### Gestion des participations

- Demande de participation
- Acceptation ou refus par l'organisateur
- Liste des participants
- Annulation d'une participation

### Messagerie

- Conversation privée entre participants
- Historique des messages

### Avis et notation

À l'issue d'une activité :

- Note sur 5 étoiles
- Commentaire
- Calcul d'un score de fiabilité

---

## Règles métier principales

- Un utilisateur ne peut pas rejoindre sa propre activité.
- Une activité doit être planifiée dans le futur.
- Une participation est unique par utilisateur et par activité.
- Une activité ne peut pas dépasser son nombre maximum de participants.
- Seul le créateur de l'activité peut accepter ou refuser une participation.
- Une activité annulée n'accepte plus de nouvelles participations.
- Un utilisateur doit être authentifié pour créer une activité.
- Une activité possède un organisateur unique.
- Une activité ne peut dépasser son nombre maximum de participants.
- Seuls les participants d'une activité peuvent accéder à la messagerie associée.
- Un utilisateur ne peut laisser un avis qu'après avoir participé à une activité commune.
- Une activité passée ne peut plus être modifiée.

---

## II-2. Version 1.1

### Communication

- Messagerie entre participants


### Système communautaire

- Avis et notation des utilisateurs
- Score de fiabilité


## Listes des routes de l'application 🛣️

| Méthode | Route                | Description             | Données attendues                                    |
| ------- | -------------------- | ----------------------- | ---------------------------------------------------- |
| POST    | `/api/auth/register` | Inscription utilisateur | `{ firstname, lastname, username, email, password }` |
| POST    | `/api/auth/login`    | Connexion utilisateur   | `{ email, password }` OU `{ username, password }`    |
| POST    | `/api/auth/logout`   | Déconnexion utilisateur | 
-                                                    |

### Gestion utilisateur

| Méthode | Route               | Description         | Données attendues                              |
| ------- | ------------------- | ------------------- | ---------------------------------------------- |
| PUT    | `/api/me/profile`   | modifier le profil | 
| GET    | `/api/me`   |  récupérer le profil            | 
| DELETE    | `/api/me`   |  supprimer le profil            | 
                                             |

### Sports

| Méthode | Route               | Description           | Données attendues                     |
| ------- | ------------------- | --------------------- | ------------------------------------- |
| GET     | `/api/sports:id` | rechercher un sport |  |
| GET     | `/api/sports`    | 
| POST     | `/api/sports/:id`    | Ajouter un sport    |                |             |
| DELETE     | `/api/sports/:id`    | Supprimer un sport    | 

### Activités

| Méthode | Route                  | Description               | Données attendues                                                 |
| ------- | ---------------------- | ------------------------- | ----------------------------------------------------------------- |
| GET     | `/api/activities`         | Récupérer une activité |                                |
| GET    | `/api/activities/:id`         |  Récupérer une activité         |  |
| DELETE  | `/api/activities/:id` | Supprimer une activité          |                                                 |
| PUT  | `/api/activities/:id` | Modifier une activité          |                                                 |
| POST  | `/api/activities` | Ajouter une activité          |                                    
### Participation

             |
| Méthode | Route | Description |
|----------|----------|----------|
| POST | `/api/activities/:id/join` | Demande de participation |
| PUT | `/api/participations/:id/accept` | Accepter une demande |
| PUT | `/api/participations/:id/refuse` | Refuser une demande |
| DELETE | `/api/participations/:id` | Annuler une participation |


### Messages

| Méthode | Route                                  | Description            | Données attendues                                |
| ------- | -------------------------------------- | ---------------------- | ------------------------------------------------ |
| GET     | `/api/conversations`                   | Récupérer les conversations   |  |
| GET    | `/api/conversations/:id/message`                   | Récupérer un message       |   |
| POST     | `/api/conversations/:id/message`               | Ajouter un message                      |

### Avis et notes

| Méthode | Route                    | Description               | Données attendues                               |
| ------- | ------------------------ | ------------------------- | ----------------------------------------------- |
| POST     | `/api/reviews` | Ajouter un avis |
| DELETE    | `/api/reviews/:id` | Supprimer un avis |                           |




# UserStories 👥

#### Rôles Utilisateurs

- **Visiteur** : Utilisateur non connecté découvrant l'application
- **Utilisateur** : Utilisateur connecté gérant sa bibliothèque personnelle
- **Administrateur** : Rôle de modération et gestion globale

## 👥 Rôle : Visiteur (non connecté)

### 🚀 V1.0 (MVP) - Fonctionnalités Essentielles

| En tant que                      | Je souhaite que                                                                                     | Afin de                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **US-V01**: En tant que visiteur | je veux voir une page d'accueil présentant 66Partners afin de découvrir rapidement l'application et m'inciter à m'inscrire         |
| **US-V02**: En tant que visiteur | je veux m'inscrire avec un email et un mot de passe                                                 | afin de créer un compte sécurisé et accéder aux fonctionnalités personnelles |
| **US-V03**: En tant que visiteur | je veux me connecter avec mes identifiants                                                          | afin d'accéder à mon compte existant                                         |
| **US-V04**: En tant que visiteur | je veux pouvoir réinitialiser mon mot de passe |               |



## 👥 Rôle : Utilisateurs

### 🚀 V1.0 (MVP) - Fonctionnalités Essentielles

| En tant que                                 | Je souhaite que                                                                            | Afin de                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| **US-U01**: En tant qu'utilisateur connecté | je veux voir les sport populaires autour de chez moi                                            | afin de mieux m'orienter |
| **US-U02**: En tant qu'utilisateur connecté | je veux voir les activités autour de chez moi                  | afin d'y participer     |
| **US-U03**: En tant qu'utilisateur connecté | je veux pouvoir ajouter un sport si celui ci n'apparait pas | afin de pouvoir créer des activités          |
| **US-U04**: En tant qu'utilisateur connecté | je veux me déconnecter de manière sécurisée                                                | afin de protéger mes données personnelles.      |
| **US-U05**: En tant qu'utilisateur connecté | je veux modifier mes informations de profil                                                | afin de maintenir mes données à jour.           |
| **US-U06**: En tant qu'utilisateur connecté | je veux pouvoir supprimer mon profil                                                |       |
| **US-U07**: En tant qu'utilisateur connecté | je veux pouvoir demander à participer à une activité                                  | afin de faire de nouvelles connaissances          |
| **US-U08**: En tant qu'utilisateur connecté | je veux pouvoir me retirer d'une activité                                          |           |
| **US-U09**: En tant qu'utilisateur connecté | je veux accéder à ma messagerie                                          | afin de me tenir au courant de mes participations |
| **US-U10** | En tant qu'utilisateur connecté | je veux créer une activité sportive | afin de trouver des partenaires |
| **US-U11** | En tant qu'utilisateur connecté | je veux modifier une activité dont je suis l'organisateur | afin de mettre à jour ses informations |
| **US-U12** | En tant qu'utilisateur connecté | je veux supprimer une activité dont je suis l'organisateur | afin d'annuler une sortie |
| **US-U13** | En tant qu'utilisateur connecté | je veux accepter une demande de participation | afin de constituer mon groupe |
| **US-U14** | En tant qu'utilisateur connecté | je veux refuser une demande de participation | afin de contrôler les participants |

### 🌱 V1.1 - Améliorations Rapides

| En tant que                                 | Je souhaite que                                                                                      | Afin de                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **US-U06**: En tant qu'utilisateur connecté | je veux partager mes sorties sur Strava                                                     | afin de partager mes résultats avec mes abonnés|
| **US-U07**: En tant qu'utilisateur connecté | je veux pouvoir payer une version premium si il y a                     |

### 📱 V2.0 - Extension Mobile

| En tant que                                 | Je souhaite que                                   | Afin de                                        |
| ------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| **US-U15**: En tant qu'utilisateur connecté | je veux pouvoir lancer le arcours via strava | afin de l'ajouter directement dans l'application |

## 👥 Rôle : Administrateur

### 🚀 V1.0 (MVP) - Fonctionnalités Essentielles

| En tant que                           | Je souhaite que                                                                                  | Afin de                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **US-A01**: En tant qu'administrateur |consulter les utilisateurs inscrits    | superviser la plateforme.                   |
| **US-A02**: En tant qu'administrateur | suspendre un utilisateur   | limiter les abus                |
| **US-A03**: En tant qu'administrateur | supprimer un utilisateur                | respecter les règles de la plateforme |                 |
| **US-A04**: En tant qu'administrateur | ajouter un sport             |maintenir le catalogue  |
| **US-A05**: En tant qu'administrateur | supprimer un sport |  maintenir le catalogue              |


### 🌱 V1.2 - Améliorations Rapides

| En tant que                           | Je souhaite que                                                                                                        | Afin de                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **US-A07**: En tant qu'administrateur | je veux modérer les avis et commentaires des utilisateurs (supprimer ou éditer)                                        | afin de maintenir un environnement respectueux et conforme aux règles. |
| **US-A08**: En tant qu'administrateur | je veux accéder à des statistiques globales de la plateforme (nombre d'utilisateurs, livres les plus populaires, etc.) | afin d'analyser l'usage et proposer des améliorations.                 |

### 🔒 V1.2 - Sécurité Avancée

| En tant que                            | Je souhaite que                                                  | Afin de                                                   |
| -------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| **US-A09**: En tant qu'administrateur  | je veux configurer les paramètres de sécurité de l'application   | afin de protéger la plateforme contre les vulnérabilités. |
| **US-A010**: En tant qu'administrateur | je veux créer et gérer différents niveaux d'accès administrateur | afin d'organiser la gestion de l'équipe                   |





                           |

## RGPD (Réglement Général sur la protection des données) ⚠️

## **1**. Inventorier les données personnelles collectées:

- Liste toutes les données collectées : nom, prénom, email, mot de passe, , avis, adresse IP, cookies, etc. Ne collecte que ce qui est nécessaire au fonctionnement de la plateforme (principe de minimisation).

## **2**.Afficher une politique de confidentialité:

- Publier une politique de confidentialité claire, accessible depuis toujours (ex : pied de page). Elle doit expliquer :

- Qui est responsable du traitement des données

- Les finalités des traitements (inscription,- Profil sportif
- Sports pratiqués
- Activités créées
- Participations
- Messagerie
- Avis et notations)

- Les bases légales (ex : exécution du contrat ou consentement)

- Les droits utilisateurs (accès, rectification, suppression, limitation, opposition, portabilité)

- La durée de conservation de chaque type de donnée

- À qui les données sont transmises le cas échéant.

## **3**. Consentement explicite là où nécessaire:

- Ajoute des cases à cocher pour le consentement lors de l’inscription ou de l’ajout d’options (ex : recevoir une newsletter).

- _Cookie banner_: informe clairement sur la présence de cookies et leur utilisation, et permets un choix granulaire (nécessaires, statistiques, marketing…).

## **4.** Faciliter l’exercice des droits des personnes.

Permet aux utilisateurs de :

- Accéder à leurs données (section "mon compte")
- Les modifier, les supprimer ou demander leur suppression
- Récupérer leurs données (droit à la portabilité)
- Retirer leur consentement aussi facilement qu’ils l’ont donné.

## **5.** Sécurité des données

- Utilise le chiffrement (https pour le site, mots de passe hashés)
- Limite l’accès aux données aux seules personnes nécessaires
- Mets en place des sauvegardes et procédures en cas de violation (notifier toute fuite sous 72h à la CNIL et aux utilisateurs concernés)
- Documente les mesures de sécurité et conserve un registre des traitements.

## **6.** Registre des traitements

Même pour une petite application, maintiens un registre des traitements : chaque traitement (ex : création de compte, gestion des listes…), les données concernées, la finalité, durée de conservation, éventuels sous-traitants, mesures de sécurité, etc..

## **7.** Information & gestion des cookies/traceurs

Informer sur l’utilisation de cookies ou traceurs et permettre le refus sauf ceux strictement nécessaires.

Mettre en place un gestionnaire de cookies conforme (bandeau, consentement granulaire…).

## **8.** Sensibiliser l’équipe (si elle existe)

Toute personne ayant accès aux données doit être sensibilisée à la protection de la vie privée et à la sécurité.

**RGPD et Mentions Légales :** mettre en place les mentions légales liées au règlement général sur la protection des données (RGPD).

```
  ** Au RGPD : articles 5.2 (responsabilité), 25 (privacy by design) et 33 (notification des violations)
  ** À la loi française "Informatique et Libertés" modifiée (loi n°78-17 du 6 janvier 1978) : articles 82 à 84 sur la sécurité des données
  ** Au Code pénal français : articles 323-1 à 323-7 sur les atteintes aux systèmes de traitement automatisé de données
```
# XI. Modèle de données

## Entités principales

### User

- id
- email
- password
- pseudo
- city
- bio
- avatar
- createdAt
- updatedAt

### Sport

- id
- name

### UserSport

- userId
- sportId
- level

### Activity

- id
- title
- description
- city
- startDate
- levelRequired
- maxParticipants
- creatorId
- sportId

### Participation

- id
- userId
- activityId
- status

# XV. Roadmap MVP

## Phase 1

- Architecture backend
- Docker
- PostgreSQL
- Prisma

## Phase 2

- Authentification
- Gestion profil

## Phase 3

- Sports
- Activités

## Phase 4

- Participations

## Phase 5

- Déploiement Beta

### Hors MVP

- Messagerie
- Avis
- Notifications
- Mobile
- Strava

# Documents de Conception

## <p align="center" p> MPD (Modele Physique de Données)

![MPD](../ERD/erd-v2.png)

## <p align="center" p> Diagramme de Séquence

![DiagrammeSéquence](../Diagrammes/exemple-diagramme-sequence.png)

## <p align="center" p> Use Case

![UseCase](../Diagrammes/UseCase/UseCase.png)

## <p align="center" p> Diagramme d'Activité

![Diagramme d'activité](../Diagrammes/Diagramme%20Activité/diagrammeActivité.png)



