import "dotenv/config";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  activityPhotos,
  conversations,
  messages,
  participations,
  userReports,
  users,
} from "../db/schema.js";
import { sendReportAlertEmail } from "./mail.services.js";
import { signFileUrl } from "../utils/fileAccessToken.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE SIGNALEMENTS
 *
 * Un membre signale un profil, un message, une activité ou une photo.
 * L'auteur du contenu est toujours déterminé côté serveur (jamais fourni par
 * le client) et une copie du contenu est conservée pour la modération.
 */

export type ReportContext = "PROFILE" | "MESSAGE" | "ACTIVITY" | "PHOTO";
export type ReportReason = "HARASSMENT" | "INAPPROPRIATE" | "SPAM" | "DANGEROUS" | "OTHER";
export type ReportStatus = "OPEN" | "RESOLVED";

export class ReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ReportError";
  }
}

export interface CreateReportInput {
  context: ReportContext;
  /** Membre signalé (PROFILE) ou identifiant du message / de l'activité / de la photo. */
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface AdminReport {
  id: string;
  context: ReportContext;
  targetId: string | null;
  targetExcerpt: string | null;
  /** Photo signalée : lien signé pour que l'admin puisse la voir. */
  photoUrl: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  reporter: { id: string; pseudo: string } | null;
  reportedUser: { id: string; pseudo: string; avatar: string | null; openReports: number } | null;
}

const EXCERPT_MAX = 2000;
const clip = (text: string | null | undefined) => (text ?? "").slice(0, EXCERPT_MAX) || null;

/** Créateur de l'activité ou participant accepté : seuls à voir messages et photos. */
async function isActivityMember(userId: string, activityId: string, creatorId: string | null): Promise<boolean> {
  if (creatorId === userId) return true;
  const [row] = await db
    .select({ id: participations.id })
    .from(participations)
    .where(
      and(
        eq(participations.activityId, activityId),
        eq(participations.userId, userId),
        eq(participations.status, "ACCEPTED")
      )
    )
    .limit(1);
  return Boolean(row);
}

const notFound = () => new ReportError("Contenu introuvable", "TARGET_NOT_FOUND", 404);

/** Auteur et copie du contenu signalé, après contrôle d'accès du signaleur. */
async function resolveTarget(
  reporterId: string,
  context: ReportContext,
  targetId: string
): Promise<{ reportedUserId: string | null; excerpt: string | null; contentId: string | null }> {
  switch (context) {
    case "PROFILE": {
      const [user] = await db
        .select({ id: users.id, pseudo: users.pseudo, headline: users.headline, lookingFor: users.lookingFor, openTo: users.openTo })
        .from(users)
        .where(eq(users.id, targetId))
        .limit(1);
      if (!user) throw notFound();
      const excerpt = [user.pseudo, user.headline, user.lookingFor, user.openTo].filter(Boolean).join(" · ");
      return { reportedUserId: user.id, excerpt: clip(excerpt), contentId: null };
    }
    case "MESSAGE": {
      const [row] = await db
        .select({
          authorId: messages.usersId,
          contenu: messages.contenu,
          activityId: conversations.activityId,
          participantId: conversations.participantId,
          creatorId: activities.creatorId,
        })
        .from(messages)
        .innerJoin(conversations, eq(conversations.id, messages.conversationsId))
        .innerJoin(activities, eq(activities.id, conversations.activityId))
        .where(eq(messages.id, targetId))
        .limit(1);
      if (!row) throw notFound();
      // Fil privé covoiturage : seulement le duo créateur / participant.
      const canSee = row.participantId
        ? reporterId === row.participantId || reporterId === row.creatorId
        : await isActivityMember(reporterId, row.activityId, row.creatorId);
      if (!canSee) throw notFound();
      return { reportedUserId: row.authorId, excerpt: clip(row.contenu), contentId: targetId };
    }
    case "ACTIVITY": {
      const [activity] = await db
        .select({ creatorId: activities.creatorId, title: activities.title, description: activities.description, city: activities.city })
        .from(activities)
        .where(eq(activities.id, targetId))
        .limit(1);
      if (!activity) throw notFound();
      const excerpt = `${activity.title} (${activity.city})${activity.description ? ` — ${activity.description}` : ""}`;
      return { reportedUserId: activity.creatorId, excerpt: clip(excerpt), contentId: targetId };
    }
    case "PHOTO": {
      const [photo] = await db
        .select({
          uploaderId: activityPhotos.uploaderId,
          url: activityPhotos.url,
          activityId: activityPhotos.activityId,
          creatorId: activities.creatorId,
        })
        .from(activityPhotos)
        .innerJoin(activities, eq(activities.id, activityPhotos.activityId))
        .where(eq(activityPhotos.id, targetId))
        .limit(1);
      if (!photo || !(await isActivityMember(reporterId, photo.activityId, photo.creatorId))) throw notFound();
      return { reportedUserId: photo.uploaderId, excerpt: photo.url, contentId: targetId };
    }
  }
}

export class ReportService {
  static async create(reporterId: string, input: CreateReportInput): Promise<{ id: string }> {
    const { reportedUserId, excerpt, contentId } = await resolveTarget(reporterId, input.context, input.targetId);

    if (reportedUserId === reporterId) {
      throw new ReportError("Tu ne peux pas te signaler toi-même", "CANNOT_REPORT_SELF", 400);
    }

    // Un même contenu n'est compté qu'une fois par membre tant qu'il n'est pas traité.
    const [existing] = await db
      .select({ id: userReports.id })
      .from(userReports)
      .where(
        and(
          eq(userReports.reporterId, reporterId),
          eq(userReports.context, input.context),
          eq(userReports.status, "OPEN"),
          contentId
            ? eq(userReports.targetId, contentId)
            : and(isNull(userReports.targetId), reportedUserId ? eq(userReports.reportedUserId, reportedUserId) : undefined)
        )
      )
      .limit(1);
    if (existing) {
      throw new ReportError("Tu as déjà signalé ce contenu, il est en cours d'examen.", "ALREADY_REPORTED", 409);
    }

    const [created] = await db
      .insert(userReports)
      .values({
        reporterId,
        reportedUserId,
        context: input.context,
        targetId: contentId,
        targetExcerpt: excerpt,
        reason: input.reason,
        details: input.details?.trim() || null,
      })
      .returning({ id: userReports.id });

    if (!created) {
      throw new ReportError("Erreur lors de l'enregistrement du signalement", "REPORT_CREATION_FAILED", 500);
    }

    // Alerte email à l'admin : jamais bloquante pour le membre.
    ReportService.alertAdmin(created.id).catch((err) =>
      console.error("Erreur envoi email (nouveau signalement):", err)
    );

    return created;
  }

  private static async alertAdmin(reportId: string): Promise<void> {
    const [report] = await ReportService.list({ id: reportId });
    if (report) await sendReportAlertEmail(report);
  }

  /** Signalements pour l'espace admin (les plus récents d'abord). */
  static async list(filter: { status?: ReportStatus; id?: string } = {}): Promise<AdminReport[]> {
    const reporter = alias(users, "reporter");
    const reported = alias(users, "reported");

    const rows = await db
      .select({
        id: userReports.id,
        context: userReports.context,
        targetId: userReports.targetId,
        targetExcerpt: userReports.targetExcerpt,
        reason: userReports.reason,
        details: userReports.details,
        status: userReports.status,
        createdAt: userReports.createdAt,
        resolvedAt: userReports.resolvedAt,
        reporterId: reporter.id,
        reporterPseudo: reporter.pseudo,
        reportedId: reported.id,
        reportedPseudo: reported.pseudo,
        reportedAvatar: reported.avatar,
        openReports: sql<number>`(
          select count(*) from ${userReports} as open_reports
          where open_reports.reported_user_id = ${userReports.reportedUserId}
            and open_reports.status = 'OPEN'
        )`,
      })
      .from(userReports)
      .leftJoin(reporter, eq(reporter.id, userReports.reporterId))
      .leftJoin(reported, eq(reported.id, userReports.reportedUserId))
      .where(
        and(
          filter.status ? eq(userReports.status, filter.status) : undefined,
          filter.id ? eq(userReports.id, filter.id) : undefined
        )
      )
      .orderBy(desc(userReports.createdAt));

    return rows.map((row) => ({
      id: row.id,
      context: row.context,
      targetId: row.targetId,
      // Une photo est conservée par son chemin : l'admin reçoit un lien signé.
      targetExcerpt: row.context === "PHOTO" ? null : row.targetExcerpt,
      photoUrl: row.context === "PHOTO" && row.targetExcerpt ? signFileUrl(row.targetExcerpt) : null,
      reason: row.reason,
      details: row.details,
      status: row.status,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
      reporter: row.reporterId && row.reporterPseudo ? { id: row.reporterId, pseudo: row.reporterPseudo } : null,
      reportedUser:
        row.reportedId && row.reportedPseudo
          ? { id: row.reportedId, pseudo: row.reportedPseudo, avatar: row.reportedAvatar, openReports: Number(row.openReports) }
          : null,
    }));
  }

  static async setStatus(reportId: string, status: ReportStatus): Promise<void> {
    const [updated] = await db
      .update(userReports)
      .set({ status, resolvedAt: status === "RESOLVED" ? new Date() : null })
      .where(eq(userReports.id, reportId))
      .returning({ id: userReports.id });
    if (!updated) {
      throw new ReportError("Signalement non trouvé", "REPORT_NOT_FOUND", 404);
    }
  }

  static async countOpen(): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userReports)
      .where(eq(userReports.status, "OPEN"));
    return Number(row?.count ?? 0);
  }
}
