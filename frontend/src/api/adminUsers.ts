// Couche de données de la page "Utilisateurs" admin, branchée sur
// /api/admin/users (voir backend/src/routes/admin.routes.ts).

import adminApi from "../lib/adminAxios";

export interface AdminUserListItem {
  id: string;
  pseudo: string;
  city: string | null;
  avatar: string | null;
  createdAt: string;
}

export async function fetchAdminUsers(): Promise<AdminUserListItem[]> {
  const res = await adminApi.get<{ success: boolean; users: AdminUserListItem[] }>(
    "/api/admin/users",
  );
  return res.data.users;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await adminApi.delete(`/api/admin/users/${userId}`);
}
