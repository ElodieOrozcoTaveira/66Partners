# ROADMAP — 66Partners

Plan global de développement, du setup du repo jusqu'au déploiement V1.0, en s'appuyant sur le CDC (`Conception/CDC.md`) et le détail backend déjà rédigé dans `RoadmapBackend.md`.

---

## État actuel

- ✅ CDC, MCD, diagrammes UML, maquettes terminés.
- ✅ Stack tranchée : Node/Express/TypeScript, **Drizzle** + PostgreSQL + Redis, React 18 + Vite, Docker.
- ⚠️ `RoadmapBackend.md` contenait de la syntaxe Prisma renommée en "Drizzle" (commandes et schéma invalides) — corrigé.
- ⚠️ Aucun code n'existe encore (`frontend/`, `backend/` vides). Les `Dockerfile`/`docker-compose.*.yml` à la racine référencent des fichiers qui n'existent pas encore (`frontend/Dockerfile.dev`, `backend/Dockerfile.dev`, `start.js`).
- 🔲 Décision à prendre tôt : mono-repo avec **npm workspaces** (racine `package.json` + `shared/`, `backend/`, `frontend/`) pour partager les types/validateurs Zod entre front et back. Si oui, il faudra adapter les `docker-compose.*.yml` actuels (build context `./frontend`/`./backend` → contexte racine) pour que `shared/` soit visible au build.

---

## 1. Setup du repo (avant tout code métier)

- [ ] Mono-repo npm workspaces : `package.json` racine + `shared/` (types, validators Zod, constants), `backend/`, `frontend/`.
- [ ] `.gitignore` racine (node_modules, dist, .env, coverage…) — actuellement absent malgré la mention dans `.dockerignore`.
- [ ] `docker-compose.dev.yml` : déjà fonctionnel pour postgres/redis/adminer, à adapter une fois `backend/Dockerfile.dev` et `frontend/Dockerfile.dev` créés.
- [ ] Vérifier `.env` / `.env.example` (PORT, JWT_SECRET, DATABASE_URL cohérents avec ce que lira le code).

## 2. Backend MVP

Suivre **`RoadmapBackend.md`** (détaillé étape par étape, schéma Drizzle inclus). Résumé de l'ordre :

1. Init projet + Express + TypeScript + Drizzle + drizzle-kit
2. Arborescence `src/` (config, controllers, routes, services, validations, middlewares, utils)
3. Schéma Drizzle (`users`, `sports`, `userSports`, `activities`, `participations`) + migration
4. Seed des sports (liste fixe du CDC)
5. Auth (register / login / me, Argon2 + JWT + Zod)
6. Profil utilisateur + sports pratiqués
7. Sports (lecture catalogue)
8. Activités (CRUD + filtres sport/niveau/date/ville)
9. Participations (join/accept/refuse/cancel) + règles métier du CDC (un seul rôle organisateur, pas de auto-participation, etc.)
10. Gestion d'erreurs homogène (`{ success, data|message }`)
11. Tests API manuels (Postman/Thunder Client) puis Jest + Supertest
12. Sécurité (Helmet, CORS, validation Zod partout, jamais de password en réponse)
13. `GET /health`
14. Documentation des routes (`docs/api-routes.md`)

## 3. Frontend MVP

Pas encore détaillé ailleurs — à construire en miroir des routes backend et des user stories (`CDC.md` section IX) :

- [ ] Scaffold Vite + React 18 + TypeScript, React Router, Axios.
- [ ] Auth : pages Login / Register / Mot de passe oublié, contexte d'auth (token JWT en mémoire/refresh).
- [ ] Profil : page profil, édition profil, gestion des sports pratiqués + niveau.
- [ ] Sports : liste + ajout d'un sport si absent (US-U03).
- [ ] Activités : liste avec filtres (sport, niveau, date, distance, ville), détail, création, édition, suppression.
- [ ] Participations : demande de participation, liste des participants, accepter/refuser (organisateur), annulation.
- [ ] Gestion des erreurs API centralisée (intercepteur Axios) + états de chargement.
- [ ] Respect des règles métier côté UI (ex : ne pas proposer "rejoindre" sa propre activité).

## 4. Intégration

- [ ] Lancer `docker-compose.dev.yml` (postgres + redis + api + client) et vérifier le flux complet : inscription → login → création d'activité → participation → accept/refuse.
- [ ] CORS backend ↔ frontend en dev (ports 5173 / 3000).
- [ ] Tests Jest/Supertest au fur et à mesure de chaque route backend (pas tout à la fin).

## 5. V1.1

- [ ] Messagerie entre participants (probablement Socket.io, déjà évoqué dans les diagrammes de séquence du CDC).
- [ ] Avis et notation des utilisateurs + score de fiabilité (règle : un avis seulement après participation commune).
- [ ] Notifications (table déjà dans le MCD).

## 6. RGPD (avant toute mise en ligne réelle, pas juste en fin de projet)

- [ ] Politique de confidentialité accessible en pied de page.
- [ ] Cases de consentement à l'inscription (et newsletter si ajoutée).
- [ ] Bandeau cookies avec choix granulaire.
- [ ] Section "mon compte" : accès/modification/suppression/export des données.
- [ ] HTTPS obligatoire en prod, mots de passe hashés (Argon2 déjà prévu).
- [ ] Registre des traitements minimal (qui, quoi, pourquoi, durée).

## 7. Déploiement V1.0

- [ ] `backend/Dockerfile.dev` + `.prod`, `frontend/Dockerfile.dev` + `.prod` (référencés par les `docker-compose.*.yml` existants mais absents).
- [ ] Nginx (reverse proxy + SSL) déjà esquissé dans `docker-compose.prod.yml`.
- [ ] Décider de la cible d'hébergement (le `Dockerfile` racine actuel vise un déploiement Railway "tout-en-un" — à confirmer si toujours pertinent vs. le `docker-compose.prod.yml` multi-services).
- [ ] CI minimale : lint + tests + build sur chaque PR.

## 8. V2.0 (évolutions, hors scope immédiat)

- Application mobile React Native
- Intégration Strava
- Groupes sportifs
- Système Premium (`ResumeVersion.md` détaille déjà le modèle économique envisagé)
- Suggestions intelligentes de partenaires (score de compatibilité)

---

## Ordre recommandé pour démarrer maintenant

```txt
1. Setup repo (workspaces, .gitignore, Dockerfiles manquants)
2. Backend MVP (RoadmapBackend.md, étapes 1 à 6 : init → auth)
3. Frontend MVP (scaffold + pages Auth, branchées sur le backend dès que /auth fonctionne)
4. Backend MVP suite (étapes 7 à 10 : profil, sports, activités, participations)
5. Frontend MVP suite (profil, sports, activités, participations)
6. Intégration complète + tests
7. RGPD (mentions légales, cookies, politique de confidentialité)
8. Déploiement V1.0
9. V1.1 (messagerie, avis, notifications)
```

Le MVP est "terminé" quand un utilisateur peut : créer un compte → se connecter → renseigner son profil sportif → consulter/créer une activité → qu'un autre utilisateur demande à participer → que l'organisateur accepte ou refuse — le tout avec une interface fonctionnelle, pas seulement via Postman.
