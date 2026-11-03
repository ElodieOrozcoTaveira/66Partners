import { useEffect, useRef, useState, type FormEvent } from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { ArrowLeft, Flag, Send } from "lucide-react";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationsContext";
import { formatTime } from "../../../lib/dateFormat";
import "./PrivateMessage.scss";
import "../../../components/ConfirmDialog/ConfirmDialog.scss";
import "../../../components/Moderation/Moderation.scss";
import ReportDialog from "../../../components/Moderation/ReportDialog";
import BlockDialog from "../../../components/Moderation/BlockDialog";
import type { ReportTarget } from "../../../api/moderation";
import { useBranding, useTerritory } from "../../../contexts/TerritoryContext";

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
  const { asset } = useBranding();
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  // Présent = fil privé covoiturage avec ce participant ; absent = fil de
  // groupe de l'activité (comportement historique, inchangé).
  const carpoolParticipantId = searchParams.get("carpool");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;
  const { notifications, markManyAsRead } = useNotifications();

  const [activity, setActivity] = useState<ActivityInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [moderation, setModeration] = useState<{ messageId: string; userId: string; pseudo: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ userId: string; pseudo: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // territoryCode se résout de façon asynchrone au premier montage (ne pas
    // appeler avant) ET change à chaque switch de territoire : rejoue alors
    // ce chargement dans le nouveau contexte plutôt que de garder affiché un
    // fil qui appartenait à l'ancien territoire (cf. audit isolation
    // territoriale de la messagerie).
    if (!activityId || !territoryCode) return;
    let mounted = true;
    setIsLoading(true);
    setNotFound(false);

    async function load() {
      try {
        const conversationUrl = carpoolParticipantId
          ? `/api/activities/${activityId}/conversation?carpool=${carpoolParticipantId}&territory=${territoryCode}`
          : `/api/activities/${activityId}/conversation?territory=${territoryCode}`;

        const [activityRes, conversationRes] = await Promise.all([
          api.get<{ activity: ActivityInfo }>(`/api/activities/${activityId}`),
          api.get<{ conversation: { id: string } }>(conversationUrl),
        ]);
        if (!mounted) return;

        setActivity(activityRes.data.activity);
        const convId = conversationRes.data.conversation.id;
        setConversationId(convId);

        const messagesRes = await api.get<{ messages: MessageItem[] }>(
          `/api/conversations/${convId}/messages`,
          { params: { territory: territoryCode } },
        );
        if (!mounted) return;
        setMessages([...messagesRes.data.messages].reverse());
      } catch (err) {
        if (!mounted) return;
        // Changement de territoire en cours de consultation : jamais une
        // erreur générique, on quitte simplement ce fil devenu hors contexte.
        if (isAxiosError(err) && err.response?.data?.code === "WRONG_TERRITORY") {
          navigate("/messages", { replace: true });
          return;
        }
        console.error(
          "PrivateMessage: failed to load conversation",
          err instanceof Error ? err.message : "Erreur inconnue",
        );
        setNotFound(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [activityId, carpoolParticipantId, territoryCode, navigate]);

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
    if (!contenu || !conversationId || !territoryCode || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post<{ message: MessageItem }>(
        `/api/conversations/${conversationId}/messages`,
        { contenu, territory: territoryCode },
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
      console.error(
        "PrivateMessage: failed to send message",
        err instanceof Error ? err.message : "Erreur inconnue",
      );
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
        <h1 className="privatemessage-page__title">
          {carpoolParticipantId && "🚗 Covoiturage — "}
          {activity?.title ?? "Discussion"}
        </h1>
      </header>

      <div className="privatemessage-page__body">
        {isLoading ? (
          <p className="privatemessage-page__empty">Chargement...</p>
        ) : notFound ? (
          <p className="privatemessage-page__empty">
            Cette conversation n'est pas (encore) disponible.
          </p>
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
                      src={message.authorAvatar || asset("avatarDefault")}
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
                {!isMine && (
                  <button
                    type="button"
                    className="message-row__flag"
                    onClick={() =>
                      setModeration({ messageId: message.id, userId: message.usersId, pseudo: message.authorPseudo })
                    }
                    aria-label={`Signaler ce message ou bloquer ${message.authorPseudo}`}
                    title="Signaler ou bloquer"
                  >
                    <Flag size={13} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message choisi : signaler le message ou bloquer son auteur. */}
      {moderation && (
        <div className="confirm-dialog-overlay" onClick={() => setModeration(null)}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3 className="confirm-dialog__title">Message de {moderation.pseudo}</h3>
            <div className="confirm-dialog__actions moderation-choice">
              <button
                type="button"
                className="confirm-dialog__cancel"
                onClick={() => {
                  setReportTarget({ context: "MESSAGE", targetId: moderation.messageId });
                  setModeration(null);
                }}
              >
                Signaler ce message
              </button>
              <button
                type="button"
                className="confirm-dialog__confirm"
                onClick={() => {
                  setBlockTarget({ userId: moderation.userId, pseudo: moderation.pseudo });
                  setModeration(null);
                }}
              >
                Bloquer {moderation.pseudo}
              </button>
            </div>
          </div>
        </div>
      )}
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
      <BlockDialog
        member={blockTarget}
        onClose={() => setBlockTarget(null)}
        onBlocked={() => {
          // Ses messages disparaissent tout de suite (le serveur les masque aussi).
          const blockedId = blockTarget?.userId;
          setMessages((current) => current.filter((item) => item.usersId !== blockedId));
          setBlockTarget(null);
        }}
      />

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
