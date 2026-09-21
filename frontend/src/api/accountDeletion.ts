// Suppression du compte de l'utilisateur authentifié, branchée sur
// DELETE /api/users/me (voir backend/src/routes/user.routes.ts).

import api from "../lib/axios";

export async function deleteMyAccount(): Promise<void> {
  await api.delete("/api/users/me");
}
