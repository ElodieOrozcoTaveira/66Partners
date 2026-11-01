import type { ChatMessage, ConversationSummary } from "../types/domain";
import { api } from "./api";

/**
 * Messagerie d'activité (mêmes routes REST que le web). Le territoire actif
 * est toujours transmis : le serveur refuse une discussion d'un autre
 * territoire (code WRONG_TERRITORY).
 */

export const MESSAGES_PAGE_SIZE = 50;
export const MESSAGE_MAX_LENGTH = 2000;

/** GET /conversations/mine?territory= */
export async function getMyConversations(territory: string): Promise<ConversationSummary[]> {
  const response = await api.get<{ success: boolean; conversations: ConversationSummary[] }>(
    "/conversations/mine",
    { params: { territory } }
  );
  return response.data.conversations;
}

/**
 * GET /activities/:id/conversation — discussion de groupe (créée si besoin),
 * ou fil privé covoiturage avec `carpool` = identifiant du participant.
 */
export async function getActivityConversation(
  activityId: string,
  territory: string,
  carpool?: string
): Promise<{ id: string }> {
  const response = await api.get<{ success: boolean; conversation: { id: string } }>(
    `/activities/${activityId}/conversation`,
    { params: carpool ? { territory, carpool } : { territory } }
  );
  return response.data.conversation;
}

/** GET /conversations/:id/messages — page de messages, plus récents d'abord. */
export async function getMessages(
  conversationId: string,
  territory: string,
  offset = 0
): Promise<ChatMessage[]> {
  const response = await api.get<{ success: boolean; messages: ChatMessage[] }>(
    `/conversations/${conversationId}/messages`,
    { params: { territory, limit: MESSAGES_PAGE_SIZE, offset } }
  );
  return response.data.messages;
}

/** POST /conversations/:id/messages — renvoie le message créé (sans auteur). */
export async function sendMessage(
  conversationId: string,
  contenu: string,
  territory: string
): Promise<Omit<ChatMessage, "authorPseudo" | "authorAvatar">> {
  const response = await api.post<{
    success: boolean;
    message: Omit<ChatMessage, "authorPseudo" | "authorAvatar">;
  }>(`/conversations/${conversationId}/messages`, { contenu, territory });
  return response.data.message;
}
