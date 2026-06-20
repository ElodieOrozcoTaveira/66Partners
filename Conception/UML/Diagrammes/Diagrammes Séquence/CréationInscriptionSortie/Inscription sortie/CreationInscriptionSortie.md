# Diagramme de séquence — Création et inscription à une sortie

```mermaid
sequenceDiagram
  participant O as Organisateur
  participant App as App (Next.js / RN)
  participant API as API Express
  participant DB as Postgres+PostGIS
  participant Sock as Socket.io
  participant P as Participant intéressé

  O->>App: Crée une sortie (sport, date, lieu, niveau, places)
  App->>API: POST /events
  API->>DB: Enregistre l'événement
  DB-->>API: Confirmation création
  API->>Sock: Émet "new_event" aux utilisateurs proches/intéressés
  Sock-->>P: Notification temps réel "nouvelle sortie"
  P->>App: Consulte le détail de la sortie
  App->>API: GET /events/:id
  API->>DB: Récupère détails + places restantes
  DB-->>API: Données de l'événement
  API-->>App: Détail de la sortie
  P->>App: S'inscrit à la sortie
  App->>API: POST /events/:id/join
  API->>DB: Vérifie places disponibles
  alt Places disponibles
    API->>DB: Ajoute le participant
    API->>Sock: Émet "participant_joined" dans la room event:id
    Sock-->>O: Notification temps réel (nouveau participant)
    Sock-->>P: Confirmation d'inscription
  else Sortie complète
    API-->>App: Erreur "places épuisées"
    App-->>P: Affiche message d'erreur
  end
```

## Description

1. L'organisateur crée une sortie avec les informations clés (sport, date, lieu, niveau, nombre de places).
2. L'événement est enregistré en base, puis Socket.io diffuse une notification aux utilisateurs concernés (proximité géographique, sport pratiqué).
3. Un participant intéressé consulte le détail de la sortie via l'API.
4. Lors de l'inscription, l'API vérifie d'abord qu'il reste des places disponibles.
5. Si une place est libre, le participant est ajouté en base et tous les membres de la room Socket.io de l'événement (organisateur compris) reçoivent une mise à jour en temps réel.
6. Si la sortie est complète, une erreur claire est renvoyée à l'utilisateur.