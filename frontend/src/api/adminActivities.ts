// Couche de données de la page "Activités" admin, branchée sur
// /api/admin/activities (voir backend/src/routes/admin.routes.ts).

import adminApi from "../lib/adminAxios";

export interface AdminActivityListItem {
  id: string;
  title: string;
  city: string;
  startDate: string;
  // Nullable : le créateur a pu supprimer son compte, l'activité reste listée.
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
  const res = await adminApi.get<{ success: boolean; activities: AdminActivityListItem[] }>(
    "/api/admin/activities",
    { params: { territory } },
  );
  return res.data.activities;
}

export async function fetchAdminActivity(activityId: string): Promise<AdminActivityDetail> {
  const res = await adminApi.get<{ success: boolean; activity: AdminActivityDetail }>(
    `/api/admin/activities/${activityId}`,
  );
  return res.data.activity;
}
