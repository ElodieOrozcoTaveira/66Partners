# Diagramme de séquence — Recherche & matching de partenaire

```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant App as App (Next.js / RN)
  participant API as API Express
  participant DB as Postgres+PostGIS
  participant R as Redis
  participant Sock as Socket.io

  U->>App: Recherche partenaire (sport, niveau, rayon)
  App->>API: GET /partners/search
  API->>DB: Requête géospatiale (ST_DWithin)
  DB-->>API: Liste profils compatibles
  API->>R: Vérifie cache disponibilités
  R-->>API: Disponibilités en temps réel
  API-->>App: Résultats triés
  App-->>U: Affiche profils proposés
  U->>App: Envoie une demande de match
  App->>API: POST /partners/request
  API->>DB: Enregistre la demande
  API->>Sock: Émet "match_request" à l'utilisateur cible
  Sock-->>App: Notification temps réel
  App-->>U: Affiche notification reçue
```

## Description

1. L'utilisateur lance une recherche de partenaire (sport, niveau, rayon de recherche).
2. L'API interroge PostgreSQL avec PostGIS pour récupérer les profils dans la zone géographique demandée.
3. Redis est consulté pour connaître les disponibilités en temps réel (mis à jour en cache).
4. Les résultats triés sont renvoyés et affichés à l'utilisateur.
5. L'utilisateur envoie une demande de match à un profil.
6. La demande est enregistrée en base, puis Socket.io notifie instantanément l'utilisateur cible.