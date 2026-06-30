import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ──────────────────────────────────────────────
// Schémas communs
// ──────────────────────────────────────────────

const LevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).openapi('Level');
const ActivityStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).openapi('ActivityStatus');
const ParticipationStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REFUSED']).openapi('ParticipationStatus');

const ErrorResponse = z.object({
  message: z.string(),
}).openapi('ErrorResponse');

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

const RegisterSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
}).openapi('RegisterInput');

const LoginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string(),
}).openapi('LoginInput');

const AuthTokenResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
}).openapi('AuthTokenResponse');

registry.registerPath({
  method: 'post', path: '/api/auth/register', summary: 'Inscription utilisateur', tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: RegisterSchema } } } },
  responses: {
    201: { description: 'Compte créé', content: { 'application/json': { schema: AuthTokenResponse } } },
    400: { description: 'Données invalides', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/auth/login', summary: 'Connexion utilisateur', tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: LoginSchema } } } },
  responses: {
    200: { description: 'Connexion réussie', content: { 'application/json': { schema: AuthTokenResponse } } },
    401: { description: 'Identifiants invalides', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'post', path: '/api/auth/logout', summary: 'Déconnexion utilisateur', tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  responses: { 204: { description: 'Déconnexion réussie' } },
});

registry.registerPath({
  method: 'post', path: '/api/auth/refresh', summary: "Rafraîchir le token d'accès", tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: z.object({ refreshToken: z.string() }) } } } },
  responses: { 200: { description: 'Nouveau token généré', content: { 'application/json': { schema: AuthTokenResponse } } } },
});

registry.registerPath({
  method: 'post', path: '/api/auth/forgot-password', summary: 'Demande de réinitialisation', tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: z.object({ email: z.string().email() }) } } } },
  responses: { 200: { description: 'Email de réinitialisation envoyé' } },
});

registry.registerPath({
  method: 'post', path: '/api/auth/reset-password', summary: 'Réinitialisation du mot de passe', tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: z.object({ token: z.string(), newPassword: z.string().min(8) }) } } } },
  responses: { 200: { description: 'Mot de passe mis à jour' } },
});

// ──────────────────────────────────────────────
// Utilisateurs
// ──────────────────────────────────────────────

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  pseudo: z.string(),
  city: z.string().nullable(),
  bio: z.string().nullable(),
  avatar: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
}).openapi('User');

const UpdateUserSchema = z.object({
  pseudo: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).openapi('UpdateUserInput');

registry.registerPath({
  method: 'get', path: '/api/me', summary: 'Récupérer le profil connecté', tags: ['Utilisateurs'],
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Profil utilisateur', content: { 'application/json': { schema: UserSchema } } } },
});

registry.registerPath({
  method: 'put', path: '/api/me/profile', summary: 'Modifier le profil', tags: ['Utilisateurs'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateUserSchema } } } },
  responses: { 200: { description: 'Profil mis à jour', content: { 'application/json': { schema: UserSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/me', summary: 'Supprimer le profil', tags: ['Utilisateurs'],
  security: [{ bearerAuth: [] }],
  responses: { 204: { description: 'Profil supprimé' } },
});

registry.registerPath({
  method: 'get', path: '/api/users/{id}', summary: "Consulter le profil public d'un utilisateur", tags: ['Utilisateurs'],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Profil public', content: { 'application/json': { schema: UserSchema } } } },
});

// ──────────────────────────────────────────────
// Sports
// ──────────────────────────────────────────────

const SportSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
}).openapi('Sport');

registry.registerPath({
  method: 'get', path: '/api/sports', summary: 'Lister tous les sports', tags: ['Sports'],
  responses: { 200: { description: 'Liste des sports', content: { 'application/json': { schema: z.array(SportSchema) } } } },
});

registry.registerPath({
  method: 'get', path: '/api/sports/{id}', summary: 'Récupérer un sport', tags: ['Sports'],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Détail du sport', content: { 'application/json': { schema: SportSchema } } } },
});

registry.registerPath({
  method: 'post', path: '/api/sports', summary: 'Ajouter un sport', tags: ['Sports'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: z.object({ name: z.string() }) } } } },
  responses: { 201: { description: 'Sport créé', content: { 'application/json': { schema: SportSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/sports/{id}', summary: 'Supprimer un sport', tags: ['Sports'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Sport supprimé' } },
});

// ──────────────────────────────────────────────
// Sports pratiqués (UserSport)
// ──────────────────────────────────────────────

const UserSportSchema = z.object({
  sportId: z.string().uuid(),
  level: LevelEnum,
}).openapi('UserSport');

registry.registerPath({
  method: 'get', path: '/api/me/sports', summary: 'Lister les sports pratiqués', tags: ['Sports pratiqués'],
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Liste des sports pratiqués', content: { 'application/json': { schema: z.array(UserSportSchema) } } } },
});

registry.registerPath({
  method: 'post', path: '/api/me/sports', summary: 'Ajouter un sport pratiqué', tags: ['Sports pratiqués'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UserSportSchema } } } },
  responses: { 201: { description: 'Sport pratiqué ajouté', content: { 'application/json': { schema: UserSportSchema } } } },
});

registry.registerPath({
  method: 'put', path: '/api/me/sports/{sportId}', summary: 'Modifier le niveau pour un sport', tags: ['Sports pratiqués'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ sportId: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ level: LevelEnum }) } } },
  },
  responses: { 200: { description: 'Niveau mis à jour', content: { 'application/json': { schema: UserSportSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/me/sports/{sportId}', summary: 'Retirer un sport pratiqué', tags: ['Sports pratiqués'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ sportId: z.string().uuid() }) },
  responses: { 204: { description: 'Sport pratiqué retiré' } },
});

// ──────────────────────────────────────────────
// Activités
// ──────────────────────────────────────────────

const ActivitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(150),
  description: z.string().nullable(),
  city: z.string(),
  startDate: z.string().datetime(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  levelRequired: LevelEnum,
  maxParticipants: z.number().int(),
  status: ActivityStatusEnum,
  sportId: z.string().uuid(),
  creatorId: z.string().uuid(),
  createdAt: z.string().datetime(),
}).openapi('Activity');

const CreateActivitySchema = ActivitySchema.omit({ id: true, status: true, creatorId: true, createdAt: true }).openapi('CreateActivityInput');
const UpdateActivitySchema = CreateActivitySchema.partial().openapi('UpdateActivityInput');

registry.registerPath({
  method: 'get', path: '/api/activities', summary: 'Lister les activités (filtrage + pagination)', tags: ['Activités'],
  request: {
    query: z.object({
      sport: z.string().uuid().optional(),
      level: LevelEnum.optional(),
      date: z.string().datetime().optional(),
      radius: z.number().optional(),
      city: z.string().optional(),
      page: z.number().int().optional(),
      limit: z.number().int().optional(),
    }),
  },
  responses: { 200: { description: 'Liste des activités', content: { 'application/json': { schema: z.array(ActivitySchema) } } } },
});

registry.registerPath({
  method: 'get', path: '/api/activities/{id}', summary: "Récupérer le détail d'une activité", tags: ['Activités'],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: "Détail de l'activité", content: { 'application/json': { schema: ActivitySchema } } } },
});

registry.registerPath({
  method: 'post', path: '/api/activities', summary: 'Créer une activité', tags: ['Activités'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateActivitySchema } } } },
  responses: { 201: { description: 'Activité créée', content: { 'application/json': { schema: ActivitySchema } } } },
});

registry.registerPath({
  method: 'put', path: '/api/activities/{id}', summary: 'Modifier une activité', tags: ['Activités'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateActivitySchema } } },
  },
  responses: { 200: { description: 'Activité mise à jour', content: { 'application/json': { schema: ActivitySchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/activities/{id}', summary: 'Supprimer/annuler une activité', tags: ['Activités'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Activité supprimée' } },
});

// ──────────────────────────────────────────────
// Participations
// ──────────────────────────────────────────────

const ParticipationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  activityId: z.string().uuid(),
  status: ParticipationStatusEnum,
  createdAt: z.string().datetime(),
}).openapi('Participation');

registry.registerPath({
  method: 'get', path: '/api/activities/{id}/participations', summary: "Lister les participants d'une activité", tags: ['Participations'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Liste des participations', content: { 'application/json': { schema: z.array(ParticipationSchema) } } } },
});

registry.registerPath({
  method: 'post', path: '/api/activities/{id}/join', summary: 'Demande de participation', tags: ['Participations'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 201: { description: 'Demande envoyée', content: { 'application/json': { schema: ParticipationSchema } } } },
});

registry.registerPath({
  method: 'put', path: '/api/participations/{id}/accept', summary: 'Accepter une demande', tags: ['Participations'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Participation acceptée', content: { 'application/json': { schema: ParticipationSchema } } } },
});

registry.registerPath({
  method: 'put', path: '/api/participations/{id}/refuse', summary: 'Refuser une demande', tags: ['Participations'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Participation refusée', content: { 'application/json': { schema: ParticipationSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/participations/{id}', summary: 'Annuler une participation', tags: ['Participations'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Participation annulée' } },
});

// ──────────────────────────────────────────────
// Messagerie
// ──────────────────────────────────────────────

const MessageSchema = z.object({
  id: z.string().uuid(),
  contenu: z.string(),
  usersId: z.string().uuid(),
  conversationsId: z.string().uuid(),
  createdAt: z.string().datetime(),
}).openapi('Message');

const ConversationSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
}).openapi('Conversation');

registry.registerPath({
  method: 'get', path: '/api/conversations', summary: 'Lister les conversations', tags: ['Messagerie'],
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Liste des conversations', content: { 'application/json': { schema: z.array(ConversationSchema) } } } },
});

registry.registerPath({
  method: 'get', path: '/api/conversations/{id}/messages', summary: "Lister les messages d'une conversation", tags: ['Messagerie'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ page: z.number().int().optional(), limit: z.number().int().optional() }),
  },
  responses: { 200: { description: 'Liste des messages', content: { 'application/json': { schema: z.array(MessageSchema) } } } },
});

registry.registerPath({
  method: 'post', path: '/api/conversations/{id}/messages', summary: 'Envoyer un message', tags: ['Messagerie'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: z.object({ contenu: z.string() }) } } },
  },
  responses: { 201: { description: 'Message envoyé', content: { 'application/json': { schema: MessageSchema } } } },
});

// ──────────────────────────────────────────────
// Avis & Notations
// ──────────────────────────────────────────────

const ReviewSchema = z.object({
  id: z.string().uuid(),
  notes: z.number().int().min(1).max(5),
  commentaire: z.string().nullable(),
  usersId: z.string().uuid(),
  createdAt: z.string().datetime(),
}).openapi('Review');

registry.registerPath({
  method: 'get', path: '/api/users/{id}/reviews', summary: 'Lister les avis reçus par un utilisateur', tags: ['Avis'],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Liste des avis', content: { 'application/json': { schema: z.array(ReviewSchema) } } } },
});

registry.registerPath({
  method: 'post', path: '/api/reviews', summary: 'Ajouter un avis', tags: ['Avis'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            targetUserId: z.string().uuid(),
            activityId: z.string().uuid(),
            notes: z.number().int().min(1).max(5),
            commentaire: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: { 201: { description: 'Avis ajouté', content: { 'application/json': { schema: ReviewSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/reviews/{id}', summary: 'Supprimer un avis', tags: ['Avis'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Avis supprimé' } },
});

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  contenu: z.string().nullable(),
  estLu: z.boolean().nullable(),
  usersId: z.string().uuid(),
  createdAt: z.string().datetime(),
}).openapi('Notification');

registry.registerPath({
  method: 'get', path: '/api/notifications', summary: "Lister les notifications de l'utilisateur", tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.number().int().optional(),
      limit: z.number().int().optional(),
      unreadOnly: z.boolean().optional(),
    }),
  },
  responses: { 200: { description: 'Liste des notifications', content: { 'application/json': { schema: z.array(NotificationSchema) } } } },
});

registry.registerPath({
  method: 'put', path: '/api/notifications/{id}/read', summary: 'Marquer une notification comme lue', tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Notification marquée comme lue', content: { 'application/json': { schema: NotificationSchema } } } },
});

registry.registerPath({
  method: 'put', path: '/api/notifications/read-all', summary: 'Marquer toutes les notifications comme lues', tags: ['Notifications'],
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Toutes les notifications marquées comme lues' } },
});

// ──────────────────────────────────────────────
// Administration
// ──────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/api/admin/users', summary: 'Lister les utilisateurs inscrits', tags: ['Administration'],
  security: [{ bearerAuth: [] }],
  request: { query: z.object({ page: z.number().int().optional(), limit: z.number().int().optional() }) },
  responses: { 200: { description: 'Liste des utilisateurs', content: { 'application/json': { schema: z.array(UserSchema) } } } },
});

registry.registerPath({
  method: 'put', path: '/api/admin/users/{id}/suspend', summary: 'Suspendre un utilisateur', tags: ['Administration'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'Utilisateur suspendu', content: { 'application/json': { schema: UserSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/admin/users/{id}', summary: 'Supprimer un utilisateur', tags: ['Administration'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Utilisateur supprimé' } },
});

registry.registerPath({
  method: 'post', path: '/api/admin/sports', summary: 'Ajouter un sport (catalogue)', tags: ['Administration'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: z.object({ name: z.string() }) } } } },
  responses: { 201: { description: 'Sport ajouté', content: { 'application/json': { schema: SportSchema } } } },
});

registry.registerPath({
  method: 'delete', path: '/api/admin/sports/{id}', summary: 'Supprimer un sport (catalogue)', tags: ['Administration'],
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'Sport supprimé' } },
});

// ──────────────────────────────────────────────
// Génération du document OpenAPI
// ──────────────────────────────────────────────

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: '66Partners API',
    version: '1.0.0',
    description: "Documentation de l'API REST de 66Partners — plateforme de mise en relation sportive locale (Pyrénées-Orientales).",
  },
  servers: [{ url: 'http://localhost:3000', description: 'Serveur de développement' }],
});