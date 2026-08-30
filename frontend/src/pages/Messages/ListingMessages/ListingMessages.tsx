import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { formatMonth, formatTime } from "../../../lib/dateFormat";
import "./ListingMessages.scss";

interface LastMessage {
  contenu: string | null;
  createdAt: string;
  authorId: string;
}

interface ConversationSummary {
  activityId: string;
  activityTitle: string;
  sportName: string;
  participantsCount: number;
  conversationId: string | null;
  lastMessage: LastMessage | null;
  activityStartDate: string;
}

interface ConversationsResponse {
  success: boolean;
  conversations: ConversationSummary[];
}

interface ListingMessagesProps {
  search: string;
}

function formatRelativeDay(dateInput: string): string {
  const date = new Date(dateInput);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) return formatTime(date);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hier";

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays >= 0 && diffDays < 7) return `${diffDays}j`;

  return `${date.getDate()} ${formatMonth(date)}`;
}

export default function ListingMessages({ search }: ListingMessagesProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<ConversationsResponse>("/api/conversations/mine")
      .then((res) => {
        if (mounted) setConversations(res.data.conversations);
      })
      .catch(() => {
        if (mounted) setConversations([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = conversations.filter((conversation) =>
    conversation.activityTitle.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="container-listingmessages">
      <h2 className="container-listingmessages__h2">Discussions par activité</h2>

      {isLoading ? (
        <p className="container-listingmessages__empty">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="container-listingmessages__empty">
          {conversations.length === 0
            ? "Rejoins ou organise une activité pour démarrer une discussion."
            : "Aucune discussion ne correspond à ta recherche."}
        </p>
      ) : (
        <div className="container-listingmessages__list">
          {filtered.map((conversation) => {
            const { icon: Icon, color } = getSportVisual(conversation.sportName);

            return (
              <NavLink
                key={conversation.activityId}
                to={`/messages/${conversation.activityId}`}
                className="listingmessages-item"
              >
                <span
                  className="listingmessages-item__badge"
                  style={{ backgroundColor: color, color: getIconColor(color) }}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <div className="listingmessages-item__body">
                  <h3 className="listingmessages-item__title">
                    {conversation.activityTitle}
                  </h3>
                  <p className="listingmessages-item__meta">
                    {conversation.participantsCount} participants
                  </p>
                  {conversation.lastMessage ? (
                    <p className="listingmessages-item__preview">
                      {conversation.lastMessage.contenu}
                    </p>
                  ) : (
                    <p className="listingmessages-item__preview listingmessages-item__preview--empty">
                      Aucun message pour l'instant
                    </p>
                  )}
                </div>
                {conversation.lastMessage && (
                  <span className="listingmessages-item__time">
                    {formatRelativeDay(conversation.lastMessage.createdAt)}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
