import { useEffect, useRef, useState, type FormEvent } from "react";
import { NavLink, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationsContext";
import { formatTime } from "../../../lib/dateFormat";
import "./PrivateMessage.scss";

interface MessageItem {
  id: string;
  contenu: string | null;
  createdAt: string;
  usersId: string;
  authorPseudo: string;
  authorAvatar: string | null;
}

interface ActivityInfo {
  id: string;
  title: string;
}

export default function PrivateMessage() {
  const { activityId } = useParams<{ activityId: string }>();
  const { user } = useAuth();
  const { notifications, markManyAsRead } = useNotifications();

  const [activity, setActivity] = useState<ActivityInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activityId) return;
    let mounted = true;

    async function load() {
      try {
        const [activityRes, conversationRes] = await Promise.all([
          api.get<{ activity: ActivityInfo }>(`/api/activities/${activityId}`),
          api.get<{ conversation: { id: string } }>(
            `/api/activities/${activityId}/conversation`,
          ),
        ]);
        if (!mounted) return;

        setActivity(activityRes.data.activity);
        const convId = conversationRes.data.conversation.id;
        setConversationId(convId);

        const messagesRes = await api.get<{ messages: MessageItem[] }>(
          `/api/conversations/${convId}/messages`,
        );
        if (!mounted) return;
        setMessages([...messagesRes.data.messages].reverse());
      } catch (err) {
        console.error("PrivateMessage: failed to load conversation", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [activityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Visiter cette conversation vaut acquittement de ses notifications "nouveau
  // message" : le badge de non-lus (liste des discussions, bottom nav) se vide.
  useEffect(() => {
    if (!activityId) return;
    const unreadMessageIds = notifications
      .filter(
        (notif) =>
          notif.type === "NEW_MESSAGE" && notif.activityId === activityId && !notif.estLu,
      )
      .map((notif) => notif.id);
    if (unreadMessageIds.length > 0) markManyAsRead(unreadMessageIds);
  }, [activityId, notifications, markManyAsRead]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const contenu = draft.trim();
    if (!contenu || !conversationId || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post<{ message: MessageItem }>(
        `/api/conversations/${conversationId}/messages`,
        { contenu },
      );
      setMessages((prev) => [
        ...prev,
        {
          ...res.data.message,
          authorPseudo: user?.pseudo ?? "Moi",
          authorAvatar: user?.avatar ?? null,
        },
      ]);
      setDraft("");
    } catch (err) {
      console.error("PrivateMessage: failed to send message", err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="privatemessage-page">
      <header className="privatemessage-page__header">
        <NavLink
          to="/messages"
          className="privatemessage-page__back"
          aria-label="Retour aux messages"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </NavLink>
        <h1 className="privatemessage-page__title">{activity?.title ?? "Discussion"}</h1>
      </header>

      <div className="privatemessage-page__body">
        {isLoading ? (
          <p className="privatemessage-page__empty">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="privatemessage-page__empty">
            Aucun message pour l'instant. Lance la discussion !
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.usersId === user?.id;
            return (
              <div
                key={message.id}
                className={`message-row${isMine ? " message-row--mine" : ""}`}
              >
                {!isMine && (
                  <NavLink to={`/profile/${message.usersId}`}>
                    <img
                      src={message.authorAvatar || "/montagne.webp"}
                      alt={message.authorPseudo}
                      className="message-row__avatar"
                    />
                  </NavLink>
                )}
                <div
                  className={`message-bubble${isMine ? " message-bubble--mine" : ""}`}
                >
                  {!isMine && (
                    <NavLink
                      to={`/profile/${message.usersId}`}
                      className="message-bubble__author"
                    >
                      {message.authorPseudo}
                    </NavLink>
                  )}
                  <p className="message-bubble__text">{message.contenu}</p>
                  <span className="message-bubble__time">
                    {formatTime(new Date(message.createdAt))}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form className="privatemessage-page__composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Écrire un message..."
          disabled={!conversationId || isSending}
        />
        <button
          type="submit"
          disabled={!draft.trim() || !conversationId || isSending}
          aria-label="Envoyer"
        >
          <Send size={18} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
