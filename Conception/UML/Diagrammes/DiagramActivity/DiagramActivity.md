@startuml
title Diagramme d'activité - Participation à une activité 66Partners

start

:Accéder à 66Partners;

if (Utilisateur connecté ?) then (Non)
  :Afficher page de connexion;
  :Saisir email et mot de passe;
  
  if (Identifiants valides ?) then (Oui)
    :Connecter l'utilisateur;
  else (Non)
    :Afficher message d'erreur;
    stop
  endif
endif

:Afficher la liste des activités sportives;

:Filtrer les activités;
note right
Filtres possibles :
- Sport
- Ville
- Date
- Niveau
end note

:Sélectionner une activité;

if (Activité disponible ?) then (Oui)
  :Afficher le détail de l'activité;
else (Non)
  :Afficher message "Activité indisponible";
  stop
endif

if (Utilisateur est organisateur ?) then (Oui)
  :Afficher options organisateur;
  stop
else (Non)
  :Cliquer sur "Demander à participer";
endif

if (Demande déjà existante ?) then (Oui)
  :Afficher message "Demande déjà envoyée";
  stop
else (Non)
  :Créer une demande de participation;
  :Statut participation = PENDING;
endif

:Notifier l'organisateur;

partition "Organisateur" {
  :Consulter les demandes de participation;

  if (Accepter la demande ?) then (Oui)
    if (Nombre maximum de participants atteint ?) then (Oui)
      :Refuser automatiquement la demande;
      :Statut participation = REFUSED;
      :Notifier l'utilisateur;
      stop
    else (Non)
      :Accepter la demande;
      :Statut participation = ACCEPTED;
      :Notifier l'utilisateur;
    endif
  else (Non)
    :Refuser la demande;
    :Statut participation = REFUSED;
    :Notifier l'utilisateur;
    stop
  endif
}

:Afficher confirmation à l'utilisateur;

stop

@enduml