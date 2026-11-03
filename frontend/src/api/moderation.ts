// Signalements et blocages entre membres (backend : /api/reports,
// /api/users/:id/block, /api/users/me/blocks).

import api from "../lib/axios";

export type ReportContext = "PROFILE" | "MESSAGE" | "ACTIVITY" | "PHOTO";
export type ReportReason = "HARASSMENT" | "INAPPROPRIATE" | "SPAM" | "DANGEROUS" | "OTHER";

export interface ReportTarget {
  context: ReportContext;
  /** Membre (PROFILE) ou identifiant du message / de l'activité / de la photo. */
  targetId: string;
}

export interface BlockedMember {
  userId: string;
  pseudo: string;
  avatar: string | null;
  blockedAt: string;
}

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "HARASSMENT", label: "Harcèlement ou insultes", hint: "Propos blessants, menaces, insistance" },
  { value: "INAPPROPRIATE", label: "Contenu inapproprié", hint: "Contenu choquant, sexuel ou violent" },
  { value: "SPAM", label: "Faux profil ou spam", hint: "Usurpation, publicité, arnaque" },
  { value: "DANGEROUS", label: "Comportement dangereux", hint: "Mise en danger lors d'une sortie" },
  { value: "OTHER", label: "Autre", hint: "Précise ci-dessous" },
];

export async function reportContent(target: ReportTarget, reason: ReportReason, details?: string): Promise<void> {
  await api.post("/api/reports", { ...target, reason, details: details?.trim() || undefined });
}

export async function blockUser(userId: string): Promise<void> {
  await api.post(`/api/users/${userId}/block`);
}

export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/api/users/${userId}/block`);
}

export async function fetchMyBlocks(): Promise<BlockedMember[]> {
  const res = await api.get<{ success: boolean; blocks: BlockedMember[] }>("/api/users/me/blocks");
  return res.data.blocks;
}

/** Message d'erreur du serveur, ou texte par défaut. */
export function moderationErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  return typeof data?.message === "string" && data.message ? data.message : fallback;
}
