// Couche de données de la page "Utilisateurs" admin, branchée sur
// /api/admin/users (voir backend/src/routes/admin.routes.ts).

import adminApi from "../lib/adminAxios";

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
  const res = await adminApi.get<{ success: boolean; users: AdminUserListItem[] }>(
    "/api/admin/users",
    { params: { territory } },
  );
  return res.data.users;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await adminApi.delete(`/api/admin/users/${userId}`);
}

export async function fetchAdminUser(userId: string): Promise<AdminUserDetail> {
  const res = await adminApi.get<{ success: boolean; user: AdminUserDetail }>(`/api/admin/users/${userId}`);
  return res.data.user;
}

// --- Signalements (GET/PATCH /api/admin/reports) ---------------------------

export type AdminReportStatus = "OPEN" | "RESOLVED";

export interface AdminReport {
  id: string;
  context: "PROFILE" | "MESSAGE" | "ACTIVITY" | "PHOTO";
  targetId: string | null;
  /** Copie du contenu au moment du signalement (message, activité, profil). */
  targetExcerpt: string | null;
  /** Photo signalée : lien signé. */
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
  const res = await adminApi.get<{ success: boolean; reports: AdminReport[] }>("/api/admin/reports", {
    params: { status },
  });
  return res.data.reports;
}

export async function updateAdminReport(reportId: string, status: AdminReportStatus): Promise<void> {
  await adminApi.patch(`/api/admin/reports/${reportId}`, { status });
}
