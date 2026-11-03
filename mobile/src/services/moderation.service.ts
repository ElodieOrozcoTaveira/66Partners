import { api } from "./api";

/** Mêmes valeurs que le backend (backend/src/validations/moderation.validations.ts). */
export type ReportContext = "PROFILE" | "MESSAGE" | "ACTIVITY" | "PHOTO";
export type ReportReason = "HARASSMENT" | "INAPPROPRIATE" | "SPAM" | "DANGEROUS" | "OTHER";

export interface ReportPayload {
  context: ReportContext;
  /** Membre (PROFILE) ou identifiant du message / de l'activité / de la photo. */
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface BlockedMember {
  userId: string;
  pseudo: string;
  avatar: string | null;
  blockedAt: string;
}

/** POST /reports — l'auteur du contenu est retrouvé par le serveur. */
export async function reportContent(payload: ReportPayload): Promise<void> {
  await api.post("/reports", payload);
}

/** Les deux membres deviennent invisibles l'un pour l'autre (règle serveur). */
export async function blockUser(userId: string): Promise<void> {
  await api.post(`/users/${userId}/block`);
}

export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/block`);
}

export async function getMyBlocks(): Promise<BlockedMember[]> {
  const response = await api.get<{ success: boolean; blocks: BlockedMember[] }>("/users/me/blocks");
  return response.data.blocks;
}
