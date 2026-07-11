## Roadmap Frontend — 66Partners
### Phase 1 — Fondations
#### Setup :
 - React Router, 
 - Axios instance (baseURL, intercepteur JWT), 
 - contexte auth
 - Pages squelettes + layout (navbar, routes protégées)
 - Gestion du token (localStorage, refresh automatique sur 401)
### Phase 2 — Authentification
 - Page Inscription (POST /api/auth/register)
 - Page Connexion (POST /api/auth/login)
 - Redirection automatique si déjà connecté
 - Phase 3 — Profil utilisateur
 - Page Mon profil (affichage + édition : pseudo, bio, ville, avatar)
 - Section Mes sports (ajouter / supprimer un sport + niveau)
### Phase 4 — Activités
 - Page Liste des activités (filtres : sport, ville, niveau, date)
 - Page Détail d'une activité (infos + participants + bouton rejoindre)
 - Page Créer une activité
 - Page Mes activités (celles que j'ai créées)

### Phase 5 — Participations
 - Bouton Demander à rejoindre (depuis le détail activité)
 - Section Demandes reçues pour le créateur (accepter / refuser)
 - Section Mes demandes pour le participant (statut en attente / accepté / refusé)

### Phase 6 — Messagerie
 - Page Conversation d'une activité (accessible seulement si participation acceptée)
 - Affichage des messages + champ d'envoi
 - Temps réel via Socket.io
 
 ### Phase 7 — Polish
 - Gestion des erreurs (toasts, pages 404/403)
 - Responsive mobile
 - États de chargement (skeletons)
 - Déploiement prod final