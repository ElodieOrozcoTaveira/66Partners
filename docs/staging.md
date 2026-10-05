# Environnement STAGING — 66Partners

## Ce que c'est

Un environnement **totalement séparé** de `partners` (dev), `partners_test` (Jest) et de la production :
conteneur Postgres dédié (`postgres-staging`, volume `db_staging_data`), API dédiée (`api-staging`,
port `3001`), base `partners_staging`.

Aujourd'hui, cet environnement tourne **en local** (sur la même machine que le dev), pas encore sur un
serveur distant accessible aux testeurs — voir "Ce qu'il manque encore" plus bas.

## Démarrer

```bash
cp .env.staging.example .env.staging
# Remplir DB_PASSWORD / POSTGRES_PASSWORD (valeur identique), JWT_SECRET,
# ADMIN_JWT_SECRET, ADMIN_PASSWORD_HASH — jamais réutiliser les secrets prod.
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" pour un secret
# node -e "require('argon2').hash('...').then(console.log)" pour ADMIN_PASSWORD_HASH

docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
```

**Important** : `--env-file .env.staging` est obligatoire sur CHAQUE commande `docker compose`
touchant ce fichier — sans lui, Docker Compose résout les `${...}` du YAML avec le `.env` du dev par
défaut (piège rencontré et corrigé pendant la mise en place de cet environnement).

Au démarrage, `api-staging` applique automatiquement les migrations Drizzle puis
`seed-reference.ts` (sports + territoire 66 uniquement, jamais de démo) — idempotent, sans risque à
chaque redémarrage.

L'API est alors accessible sur `http://localhost:3001`.

## Nettoyer (revenir à une base vierge)

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging exec api-staging \
  sh -c "cd backend && npx tsx scripts/clean-staging.ts --yes"
```

Supprime tous les comptes/activités/données communautaires (cascade FK), conserve sports et
territoires. Refuse de s'exécuter contre une base dont le nom contient "test".

## Arrêter

```bash
docker compose -f docker-compose.staging.yml down       # garde les données (volume conservé)
docker compose -f docker-compose.staging.yml down -v    # supprime aussi le volume Postgres
```

## Frontend pointé sur le staging

Aucune modification du code frontend n'est nécessaire — `VITE_API_URL` est déjà le mécanisme existant
(utilisé par `frontend/Dockerfile.prod`) :

```bash
cd frontend && VITE_API_URL=http://localhost:3001 npx vite build
```

## Ce qu'il manque encore pour ouvrir aux testeurs

- Un serveur (ou un projet Hetzner dédié) distinct de celui de la production.
- Un (sous-)domaine staging (ex. `staging.66partners.fr` / `api-staging.66partners.fr`) et ses DNS.
- Un certificat TLS pour ce domaine (Let's Encrypt, comme en prod).
- Des accès SSH/déploiement pour ce serveur.
- Les secrets définitifs de cet environnement distant (différents de ceux générés localement).

Sans ces éléments, ce `docker-compose.staging.yml` reste un environnement de validation **local**,
pas un staging accessible aux 22 testeurs.
