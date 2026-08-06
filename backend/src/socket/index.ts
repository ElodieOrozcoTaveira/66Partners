import "dotenv/config";
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { getAllowedOrigins } from "../middlewares/security.middleware.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../utils/jwt.js";
import {
  activities,
  conversations,
  messages,
  participations,
} from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AuthenticatedSocket extends Socket {
  userId: string;
}

// ──────────────────────────────────────────────
// Middleware d'authentification Socket.io
// ──────────────────────────────────────────────

const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Token manquant"));
  }

  try {
    const payload = verifyToken(token);
    (socket as AuthenticatedSocket).userId = payload.id;
    next();
  } catch {
    next(new Error("Token invalide"));
  }
};

// ──────────────────────────────────────────────
// Vérification : l'utilisateur est-il participant
// accepté de l'activité liée à cette conversation ?
// ──────────────────────────────────────────────

const isParticipantOfConversation = async (
  userId: string,
  conversationId: string,
): Promise<boolean> => {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) return false;

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, conversation.activityId))
    .limit(1);

  if (!activity) return false;

  if (activity.creatorId === userId) return true;

  const [participation] = await db
    .select()
    .from(participations)
    .where(
      and(
        eq(participations.activityId, conversation.activityId),
        eq(participations.userId, userId),
        eq(participations.status, "ACCEPTED"),
      ),
    )
    .limit(1);

  return !!participation;
};

// ──────────────────────────────────────────────
// Initialisation Socket.io
// ──────────────────────────────────────────────

export const initSocket = (httpServer: HttpServer) => {
  const allowedOrigins = getAllowedOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin:
        allowedOrigins.length > 0 ? allowedOrigins : "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(authMiddleware);

  io.on("connection", (socket: Socket) => {
    const { userId } = socket as AuthenticatedSocket;
    console.log(`Utilisateur connecté : ${userId}`);

    // ── Rejoindre une room de conversation ──────
    socket.on("join_conversation", async (conversationId: string) => {
      const allowed = await isParticipantOfConversation(userId, conversationId);

      if (!allowed) {
        socket.emit("error", {
          message: "Vous n'êtes pas autorisé à accéder à cette conversation.",
        });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(`${userId} a rejoint conversation:${conversationId}`);
    });

    // ── Envoyer un message ───────────────────────
    socket.on(
      "send_message",
      async (data: { conversationId: string; contenu: string }) => {
        const { conversationId, contenu } = data;

        if (!contenu?.trim()) {
          socket.emit("error", {
            message: "Le message ne peut pas être vide.",
          });
          return;
        }

        const allowed = await isParticipantOfConversation(
          userId,
          conversationId,
        );
        if (!allowed) {
          socket.emit("error", { message: "Accès refusé." });
          return;
        }

        try {
          const [newMessage] = await db
            .insert(messages)
            .values({
              contenu,
              usersId: userId,
              conversationsId: conversationId,
            })
            .returning();

          if (!newMessage) throw new Error("Insert message failed");

          io.to(`conversation:${conversationId}`).emit("new_message", {
            id: newMessage.id,
            contenu: newMessage.contenu,
            senderId: userId,
            conversationId,
            createdAt: newMessage.createdAt,
          });
        } catch (err) {
          console.error("Erreur envoi message:", err);
          socket.emit("error", {
            message: "Erreur lors de l'envoi du message.",
          });
        }
      },
    );

    // ── Indicateur "en train d'écrire" ──────────
    socket.on("typing", (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user_typing", { userId });
    });

    socket.on("stop_typing", (conversationId: string) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit("user_stop_typing", { userId });
    });

    // ── Déconnexion ──────────────────────────────
    socket.on("disconnect", () => {
      console.log(`Utilisateur déconnecté : ${userId}`);
    });
  });

  return io;
};
