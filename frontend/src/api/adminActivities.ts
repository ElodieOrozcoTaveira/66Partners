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
}

export async function fetchAdminActivities(): Promise<AdminActivityListItem[]> {
  const res = await adminApi.get<{ success: boolean; activities: AdminActivityListItem[] }>(
    "/api/admin/activities",
  );
  return res.data.activities;
}
