@startuml
left to right direction
skinparam packageStyle rectangle

actor "Visiteur" as Visitor
actor "Utilisateur" as User
actor "Administrateur" as Admin

rectangle "66Partners" {

  package "Authentification" {
    usecase "Consulter la page d'accueil" as UC_Home
    usecase "S'inscrire" as UC_Register
    usecase "Se connecter" as UC_Login
    usecase "Réinitialiser le mot de passe" as UC_ResetPassword
    usecase "Se déconnecter" as UC_Logout
  }

  package "Profil utilisateur" {
    usecase "Modifier son profil" as UC_EditProfile
    usecase "Supprimer son compte" as UC_DeleteAccount
  }

  package "Sports" {
    usecase "Consulter les sports disponibles" as UC_ViewSports
    usecase "Ajouter un sport à son profil" as UC_AddUserSport
  }

  package "Activités sportives" {
    usecase "Consulter les activités" as UC_ViewActivities
    usecase "Rechercher une activité" as UC_SearchActivity
    usecase "Créer une activité" as UC_CreateActivity
    usecase "Modifier une activité" as UC_EditActivity
    usecase "Supprimer une activité" as UC_DeleteActivity
  }

  package "Participations" {
    usecase "Demander à participer" as UC_JoinActivity
    usecase "Annuler une participation" as UC_CancelParticipation
    usecase "Accepter une demande" as UC_AcceptParticipation
    usecase "Refuser une demande" as UC_RefuseParticipation
  }

  package "Administration" {
    usecase "Consulter les utilisateurs" as UC_ViewUsers
    usecase "Suspendre un utilisateur" as UC_SuspendUser
    usecase "Supprimer un utilisateur" as UC_AdminDeleteUser
    usecase "Ajouter un sport" as UC_AdminAddSport
    usecase "Supprimer un sport" as UC_AdminDeleteSport
  }

  package "V1.1 - Évolutions" {
    usecase "Accéder à la messagerie" as UC_Messages
    usecase "Partager une activité sur Strava" as UC_ShareStrava
    usecase "Souscrire à une offre Premium" as UC_Premium
    usecase "Modérer les avis" as UC_ModerateReviews
    usecase "Consulter les statistiques" as UC_Stats
  }
}

Visitor --> UC_Home
Visitor --> UC_Register
Visitor --> UC_Login
Visitor --> UC_ResetPassword

User --> UC_Logout
User --> UC_EditProfile
User --> UC_DeleteAccount
User --> UC_ViewSports
User --> UC_AddUserSport
User --> UC_ViewActivities
User --> UC_SearchActivity
User --> UC_CreateActivity
User --> UC_EditActivity
User --> UC_DeleteActivity
User --> UC_JoinActivity
User --> UC_CancelParticipation
User --> UC_AcceptParticipation
User --> UC_RefuseParticipation

Admin --> UC_ViewUsers
Admin --> UC_SuspendUser
Admin --> UC_AdminDeleteUser
Admin --> UC_AdminAddSport
Admin --> UC_AdminDeleteSport

User --> UC_Messages
User --> UC_ShareStrava
User --> UC_Premium

Admin --> UC_ModerateReviews
Admin --> UC_Stats

UC_CreateActivity ..> UC_Login : <<include>>
UC_JoinActivity ..> UC_Login : <<include>>
UC_EditProfile ..> UC_Login : <<include>>

UC_EditActivity ..> UC_CreateActivity : <<extend>>
UC_DeleteActivity ..> UC_CreateActivity : <<extend>>

UC_AcceptParticipation ..> UC_JoinActivity : <<extend>>
UC_RefuseParticipation ..> UC_JoinActivity : <<extend>>

@enduml