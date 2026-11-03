import { create, isAxiosError } from "axios";

import { API_BASE_URL } from "../config/env";
import { getAdminToken } from "../storage/admin.storage";

/**
 * Espace admin, branché sur les mêmes routes que le site web
 * (backend/src/routes/admin.routes.ts, frontend/src/api/admin*.ts).
 * Instance séparée de `api` : elle porte le jeton admin, jamais celui du
 * compte utilisateur, et un refus n'a aucun effet sur la session utilisateur.
 */
const adminApi = create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

adminApi.interceptors.request.use(async (config) => {
  const token = await getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Appelé quand le backend refuse le jeton admin (expiré ou invalide). */
let adminUnauthorizedHandler: (() => void) | null = null;

export function setAdminUnauthorizedHandler(handler: (() => void) | null): void {
  adminUnauthorizedHandler = handler;
}

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error?.config?.headers?.Authorization);
    if (isAxiosError(error) && error.response?.status === 401 && hadToken) {
      adminUnauthorizedHandler?.();
    }
    // Serveur pas encore à jour (route admin récente absente) : message
    // compréhensible plutôt que "Route non trouvée : GET /api/…".
    if (isAxiosError<{ code?: string; message?: string }>(error) && error.response?.data?.code === "ROUTE_NOT_FOUND") {
      error.response.data.message =
        "Pas encore disponible sur ce serveur : cette partie apparaîtra après la mise à jour du backend.";
    }
    return Promise.reject(error);
  }
);

// --- Authentification ------------------------------------------------------

export type AdminLoginResult =
  | { success: true; token: string }
  | { success: false; reason: "invalid" | "rate_limited" | "network" };

export async function loginAdminRequest(password: string): Promise<AdminLoginResult> {
  try {
    const res = await adminApi.post<{ success: boolean; token: string }>("/admin/auth/login", { password });
    return { success: true, token: res.data.token };
  } catch (error) {
    if (isAxiosError(error)) {
      if (error.response?.status === 429) return { success: false, reason: "rate_limited" };
      if (error.response?.status === 401) return { success: false, reason: "invalid" };
    }
    return { success: false, reason: "network" };
  }
}

/** Un seul admin : le lien part vers l'adresse de secours configurée sur le serveur. */
export async function requestAdminPasswordReset(): Promise<void> {
  await adminApi.post("/admin/auth/forgot-password");
}

// --- Territoires -------------------------------------------------------------

export interface AdminTerritory {
  code: string;
  name: string;
  brandName: string;
  isActive: boolean;
}

export async function fetchAdminTerritories(): Promise<AdminTerritory[]> {
  const res = await adminApi.get<{ territories: AdminTerritory[] }>("/admin/territories");
  return res.data.territories;
}

// --- Statistiques --------------------------------------------------------------

export type TimeRange = "7d" | "30d" | "90d";

export interface StatOverviewItem {
  key: string;
  label: string;
  value: number;
  deltaPct: number;
}

export interface StatsOverview {
  users: StatOverviewItem;
  activities: StatOverviewItem;
  participations: StatOverviewItem;
  messages: StatOverviewItem;
  notifications: StatOverviewItem;
  territoriesActive: number;
}

export interface UserEvolutionPoint {
  date: string;
  count: number;
}

export interface TerritoryBreakdownItem {
  code: string;
  name: string;
  count: number;
  percent: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface RankedPerson {
  id: string;
  pseudo: string;
  avatar: string | null;
  count: number;
}

/** Indicateurs "depuis le lancement" (GET /admin/stats/insights). */
export interface StatsInsights {
  totals: {
    users: number;
    activities: number;
    participations: number;
    conversations: number;
    messages: number;
    photos: number;
    favorites: number;
    availabilities: number;
    pushUsers: number;
  };
  engagement: {
    activeUsers: number;
    usersWithAvatar: number;
    usersWithFavorites: number;
  };
  activities: {
    upcoming: number;
    past: number;
    byStatus: Record<string, number>;
    byLevel: Record<string, number>;
    fillRatePct: number;
    avgParticipants: number;
    carpoolEnabled: number;
  };
  participationsByStatus: Record<string, number>;
  signupMethods: NamedCount[];
  topSports: NamedCount[];
  favoriteSports: NamedCount[];
  activityCities: NamedCount[];
  userCities: NamedCount[];
  topOrganizers: RankedPerson[];
  topParticipants: RankedPerson[];
}

export async function fetchStatsOverview(range: TimeRange, territory?: string): Promise<StatsOverview> {
  const res = await adminApi.get<{ overview: StatsOverview }>("/admin/stats/overview", {
    params: { range, territory },
  });
  return res.data.overview;
}

export async function fetchUserEvolution(range: TimeRange, territory?: string): Promise<UserEvolutionPoint[]> {
  const res = await adminApi.get<{ points: UserEvolutionPoint[] }>("/admin/stats/user-evolution", {
    params: { range, territory },
  });
  return res.data.points;
}

export async function fetchTerritoryBreakdown(range: TimeRange): Promise<TerritoryBreakdownItem[]> {
  const res = await adminApi.get<{ items: TerritoryBreakdownItem[] }>("/admin/stats/territory-breakdown", {
    params: { range },
  });
  return res.data.items;
}

export async function fetchStatsInsights(territory?: string): Promise<StatsInsights> {
  const res = await adminApi.get<{ insights: StatsInsights }>("/admin/stats/insights", {
    params: { territory },
  });
  return res.data.insights;
}

// --- Utilisateurs --------------------------------------------------------------

export interface AdminUserListItem {
  id: string;
  pseudo: string;
  city: string | null;
  avatar: string | null;
  createdAt: string;
  territories: string[];
  email: string;
  defaultTerritory: string | null;
  providers: string[];
  activitiesCreated: number;
  participations: number;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  pseudo: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  hasPassword: boolean;
  providers: string[];
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pushEnabled: boolean;
  territories: { code: string; name: string; isDefault: boolean; joinedAt: string }[];
  favoriteSports: string[];
  availabilities: { weekday: string; startTime: string; endTime: string }[];
  counts: {
    activitiesCreated: number;
    participations: number;
    participationsAccepted: number;
    messagesSent: number;
    photos: number;
    notificationsUnread: number;
  };
  activitiesCreated: {
    id: string;
    title: string;
    sportName: string;
    city: string;
    startDate: string;
    status: string;
    participantsCount: number;
    maxParticipants: number;
  }[];
  participations: {
    activityId: string;
    title: string;
    sportName: string;
    startDate: string;
    activityStatus: string;
    status: string;
    createdAt: string;
  }[];
}

export async function fetchAdminUsers(territory?: string): Promise<AdminUserListItem[]> {
  const res = await adminApi.get<{ users: AdminUserListItem[] }>("/admin/users", { params: { territory } });
  return res.data.users;
}

export async function fetchAdminUser(userId: string): Promise<AdminUserDetail> {
  const res = await adminApi.get<{ user: AdminUserDetail }>(`/admin/users/${userId}`);
  return res.data.user;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await adminApi.delete(`/admin/users/${userId}`);
}

// --- Activités -------------------------------------------------------------------

export interface AdminActivityListItem {
  id: string;
  title: string;
  city: string;
  startDate: string;
  /** Null si le créateur a supprimé son compte (l'activité reste listée). */
  creatorPseudo: string | null;
  createdAt: string;
  sportName: string;
  creatorId: string | null;
  status: string;
  levelRequired: string;
  maxParticipants: number;
  /** Participants acceptés (même calcul que l'application). */
  participantsCount: number;
  pendingCount: number;
  territoryCode: string;
}

export interface AdminActivityDetail {
  id: string;
  title: string;
  description: string | null;
  sportName: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  levelRequired: string;
  maxParticipants: number;
  status: string;
  carpoolEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  territory: { code: string; name: string };
  creator: { id: string; pseudo: string; avatar: string | null } | null;
  participants: {
    userId: string;
    pseudo: string;
    avatar: string | null;
    status: string;
    carpoolRequested: boolean;
    createdAt: string;
  }[];
  counts: {
    accepted: number;
    pending: number;
    refused: number;
    conversations: number;
    messages: number;
    photos: number;
  };
  lastMessageAt: string | null;
}

export async function fetchAdminActivities(territory?: string): Promise<AdminActivityListItem[]> {
  const res = await adminApi.get<{ activities: AdminActivityListItem[] }>("/admin/activities", {
    params: { territory },
  });
  return res.data.activities;
}

export async function fetchAdminActivity(activityId: string): Promise<AdminActivityDetail> {
  const res = await adminApi.get<{ activity: AdminActivityDetail }>(`/admin/activities/${activityId}`);
  return res.data.activity;
}

// --- Signalements -------------------------------------------------------------

export type AdminReportStatus = "OPEN" | "RESOLVED";

export interface AdminReport {
  id: string;
  context: "PROFILE" | "MESSAGE" | "ACTIVITY" | "PHOTO";
  targetId: string | null;
  /** Copie du contenu au moment du signalement (message, activité, profil). */
  targetExcerpt: string | null;
  /** Photo signalée : lien signé, à résoudre avec resolveMediaUrl. */
  photoUrl: string | null;
  reason: "HARASSMENT" | "INAPPROPRIATE" | "SPAM" | "DANGEROUS" | "OTHER";
  details: string | null;
  status: AdminReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; pseudo: string } | null;
  reportedUser: { id: string; pseudo: string; avatar: string | null; openReports: number } | null;
}

export async function fetchAdminReports(status?: AdminReportStatus): Promise<AdminReport[]> {
  const res = await adminApi.get<{ reports: AdminReport[] }>("/admin/reports", { params: { status } });
  return res.data.reports;
}

export async function updateAdminReport(reportId: string, status: AdminReportStatus): Promise<void> {
  await adminApi.patch(`/admin/reports/${reportId}`, { status });
}
