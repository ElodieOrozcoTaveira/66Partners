/**
 * Types métier alignés sur les réponses réelles du backend
 * (backend/src/services/*.services.ts). Les dates arrivent en chaînes ISO.
 */

export type SportLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type ActivityStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type ParticipationStatus = "PENDING" | "ACCEPTED" | "REFUSED";
export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/** GET /sports */
export interface Sport {
  id: string;
  name: string;
  createdAt: string;
  activitiesCount: number;
  participantsCount: number;
  favoritesCount: number;
}

/** GET /territories, GET /territories/mine (isDefault seulement sur /mine) */
export interface Territory {
  id: string;
  code: string;
  name: string;
  slug: string;
  brandName: string;
  inseeDepartmentCode: string | null;
  tagline: string | null;
  assetsPath: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isActive: boolean;
  isDefault?: boolean;
}

/** GET /activities, GET /activities/:id */
export interface Activity {
  id: string;
  title: string;
  description: string | null;
  city: string;
  startDate: string;
  latitude: number | null;
  longitude: number | null;
  levelRequired: SportLevel;
  maxParticipants: number;
  status: ActivityStatus;
  sportId: string;
  creatorId: string | null;
  territoryId: string;
  carpoolEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  sportName: string;
  /** Participants ACCEPTÉS (le créateur n'est pas compté). */
  participantsCount: number;
  creatorPseudo: string | null;
  creatorAvatar: string | null;
}

/** POST /activities/:id/join, GET /activities/:id/my-participation */
export interface Participation {
  id: string;
  userId: string;
  activityId: string;
  status: ParticipationStatus;
  carpoolRequested: boolean;
  createdAt: string;
}

/** GET /activities/:id/participations */
export interface ParticipationWithUser extends Participation {
  userPseudo: string;
  userAvatar: string | null;
}

/** GET /users/me/sports, GET /users/:id/sports */
export interface UserSport {
  sportId: string;
  sportName: string;
  level: SportLevel;
}

/** GET /users/me/availabilities */
export interface Availability {
  id: string;
  userId: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  createdAt: string;
}

/** GET /users/:id — profil vu par un autre utilisateur (jamais d'email). */
export interface PublicUser {
  id: string;
  pseudo: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  createdAt: string;
  territory: { code: string; name: string; brandName: string } | null;
}

/** GET /conversations/mine — une discussion de groupe par activité + fils covoiturage. */
export interface ConversationSummary {
  /** null : discussion de groupe pas encore créée (créée à la première ouverture). */
  conversationId: string | null;
  activityId: string;
  activityTitle: string;
  sportName: string;
  participantsCount: number;
  isCarpool: boolean;
  carpoolWithUserId: string | null;
  carpoolWithPseudo: string | null;
  carpoolWithAvatar: string | null;
  lastMessage: { contenu: string; createdAt: string; authorId: string } | null;
  activityStartDate: string;
}

/** GET /conversations/:id/messages (plus récents d'abord). */
export interface ChatMessage {
  id: string;
  contenu: string;
  createdAt: string;
  usersId: string;
  conversationsId: string;
  authorPseudo: string;
  authorAvatar: string | null;
}
