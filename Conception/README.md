# <p align="center" p>66Partners 

![Logo66Partners](/public/logo2.svg)


## **66Partners ?** _quézaco??_

...tout simple, une application web (puis mobile) qui va permettre aux utilisateurs de trouver un partenaire pour faire leur sport (tennis, padel, running, vélo, badminton...) en exclusivité dans les Pyrénées Orientales.




**Le Cahier des charges📔 est visualisable dans le repo**

# 🚀 Lancement du projet avec Docker

## 📦 Prérequis
- [Docker](https://docs.docker.com/get-docker/)  
- [Docker Compose](https://docs.docker.com/compose/)  
- (Optionnel) [Node.js ≥ 18](https://nodejs.org/) si vous souhaitez lancer les services **sans Docker**  
---
## ⚙️ Environnement de développement

### 📥 Installation des dépendances
Lors de la première utilisation (ou après modification des `package.json`) :  

- Installer les dépendances **backend (API)** :
    ```npm run docker:dev:install:backend```

- Installer les dépendances frontend (client) :
    ```npm run docker:dev:install:frontend```

### ▶️ Démarrer le projet

```npm run docker:dev```

Cela va :
- Lancer le frontend : http://localhost:5173
- Lancer le backend (API) : http://localhost:3000
    - - Lancer la base de données PostgreSQL : localhost:5432
    - - Monter automatiquement les volumes pour le hot reload

### 🔄 Rebuild des conteneurs

Après modification des dépendances (package.json)

- Backend :
```npm run docker:dev:install:backend```

- Frontend :
```npm run docker:dev:install:frontend```

- Rebuild complet (images propres, sans cache)
```npm run docker:dev:build```

### 🧹 Nettoyage

```npm run docker:dev:clean```

Cette commande :
- Stoppe tous les conteneurs
- Supprime les volumes associés
- Nettoie le cache Docker (docker system prune -f)

### 🐚 Accès shell au conteneur backend

Ouvre un shell interactif dans le conteneur API.
```npm run docker:dev:shell```

## 🌐 Environnement de production
### ▶️ Démarrer

Lance l’environnement de production en mode détaché (-d).
```npm run docker:prod```

### 🔄 Rebuild complet

Reconstruit les images de prod sans cache.
```npm run docker:prod:build```

### 🧹 Nettoyage

Stoppe et supprime les conteneurs + volumes.
```npm run docker:prod:clean```

### 🐚 Accès shell

Ouvre un shell dans le conteneur API.
```npm run docker:prod:shell```

## 📋 Scripts disponibles

| Script                                | Description |
|---------------------------------------|-------------|
| `npm run lint`                        | Lint backend et frontend |
| `npm run lint:fix`                    | Lint + fix automatique |
| **Développement**                     | |
| `npm run docker:dev`                  | Lance l’environnement de dev |
| `npm run docker:dev:install:backend`  | Installe les dépendances backend |
| `npm run docker:dev:install:frontend` | Installe les dépendances frontend |
| `npm run docker:dev:build`            | Rebuild complet des images (sans cache) |
| `npm run docker:dev:clean`            | Nettoyage complet (conteneurs + volumes + cache) |
| `npm run docker:dev:shell`            | Shell dans le conteneur backend |
| **Production**                        | |
| `npm run docker:prod`                 | Lance l’environnement de prod |
| `npm run docker:prod:build`           | Rebuild complet des images de prod |
| `npm run docker:prod:clean`           | Nettoyage complet en prod |
| `npm run docker:prod:shell`           | Shell dans le conteneur backend |