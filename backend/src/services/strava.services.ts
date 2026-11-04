import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  activities,
  participations,
  sports,
  stravaAccounts,
  stravaMeetingValidations,
  territories,
  users,
} from "../db/schema.js";
import { decryptSecret, encryptSecret } from "../utils/secretBox.js";
import { sendStravaLinkedEmail } from "./mail.services.js";
import { TerritoryService } from "./territory.services.js";
import { createStravaState, readStravaState } from "../utils/stravaState.js";

const db = drizzle(process.env.DATABASE_URL!);

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_DEAUTHORIZE_URL = "https://www.strava.com/oauth/deauthorize";
const STRAVA_API = "https://www.strava.com/api/v3";

/**
 * activity:read_all : lire aussi les activités privées (sinon une sortie
 * enregistrée en privé reste introuvable) ; activity:write : modifier le
 * titre et la description.
 */
export const STRAVA_SCOPE = "read,activity:read_all,activity:write";

/** Jeton considéré comme expiré s'il expire dans moins de 5 minutes. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
/** Fenêtre de recherche de l'activité Strava autour de l'heure de la sortie. */
const SEARCH_BEFORE_MS = 3 * 60 * 60 * 1000;
const SEARCH_AFTER_MS = 12 * 60 * 60 * 1000;
/** Au-delà, la sortie est trop ancienne pour être validée. */
const MAX_VALIDATION_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export class StravaError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StravaError";
  }
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
}

interface StravaActivitySummary {
  id: number;
  name: string;
  start_date: string;
}

interface StravaActivityDetail extends StravaActivitySummary {
  description: string | null;
}

function getConfig() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri || !process.env.STRAVA_TOKEN_ENCRYPTION_KEY) {
    throw new StravaError("STRAVA_NOT_CONFIGURED", 503, "La connexion à Strava n'est pas encore disponible.");
  }
  return { clientId, clientSecret, redirectUri };
}

async function stravaFetch<T>(url: string, init: RequestInit, failureCode: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new StravaError("STRAVA_UNAVAILABLE", 502, "Strava est injoignable pour le moment. Réessaie plus tard.");
  }
  if (response.status === 401) {
    throw new StravaError("STRAVA_UNAUTHORIZED", 409,"L'accès à ton compte Strava a expiré. Reconnecte Strava.");
  }
  if (response.status === 429) {
    throw new StravaError("STRAVA_RATE_LIMITED", 429, "Trop de demandes vers Strava. Réessaie dans quelques minutes.");
  }
  if (!response.ok) {
    throw new StravaError(failureCode, 502, "Strava a refusé la demande. Réessaie plus tard.");
  }
  return (await response.json()) as T;
}

async function requestTokens(params: Record<string, string>): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getConfig();
  const tokens = await stravaFetch<StravaTokenResponse>(
    STRAVA_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, ...params }),
    },
    "STRAVA_TOKEN_FAILED",
  );
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at) {
    throw new StravaError("STRAVA_TOKEN_FAILED", 502, "Réponse inattendue de Strava.");
  }
  return tokens;
}

/** Mail de confirmation, sans jamais bloquer ni faire échouer la liaison. */
async function notifyLinked(userId: string, athleteName: string | null): Promise<void> {
  try {
    const [user] = await db
      .select({ email: users.email, pseudo: users.pseudo })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return;
    const brand = await TerritoryService.getBrandForUser(userId);
    await sendStravaLinkedEmail(user, brand, athleteName);
  } catch (error) {
    console.error("Erreur envoi email de liaison Strava:", error);
  }
}

/** « Léa », « Léa et Tom », « Léa, Tom et Max », « Léa, Tom et 3 autres ». */
export function formatPartners(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length <= 3) return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
  return `${names.slice(0, 2).join(", ")} et ${names.length - 2} autres`;
}

export const StravaService = {
  /** URL vers laquelle rediriger le membre pour autoriser 66Partners sur Strava. */
  getAuthorizeUrl(userId: string): string {
    const { clientId, redirectUri } = getConfig();
    const url = new URL(STRAVA_AUTHORIZE_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("approval_prompt", "auto");
    url.searchParams.set("scope", STRAVA_SCOPE);
    url.searchParams.set("state", createStravaState(userId));
    return url.toString();
  },

  /**
   * Retour de Strava : vérifie le state, échange le code contre les jetons,
   * puis enregistre (ou remplace) le compte Strava du membre.
   */
  async handleCallback(params: {
    code: string | undefined;
    state: string | undefined;
    scope: string | undefined;
    error: string | undefined;
  }) {
    if (params.error) {
      throw new StravaError("STRAVA_ACCESS_DENIED", 400, "Connexion à Strava annulée.");
    }
    const userId = params.state ? readStravaState(params.state) : null;
    if (!userId || !params.code) {
      throw new StravaError("STRAVA_INVALID_STATE", 400, "Lien de connexion Strava invalide ou expiré.");
    }
    const grantedScope = params.scope ?? "";
    if (!grantedScope.includes("activity:write") || !grantedScope.includes("activity:read")) {
      throw new StravaError(
        "STRAVA_SCOPE_MISSING",
        400,
        "Autorise l'accès en lecture et en écriture à tes activités pour relier Strava.",
      );
    }

    const tokens = await requestTokens({ code: params.code, grant_type: "authorization_code" });
    const athleteId = tokens.athlete?.id;
    if (!athleteId) throw new StravaError("STRAVA_TOKEN_FAILED", 502, "Réponse inattendue de Strava.");

    const [linkedElsewhere] = await db
      .select({ userId: stravaAccounts.userId })
      .from(stravaAccounts)
      .where(eq(stravaAccounts.stravaAthleteId, athleteId))
      .limit(1);
    if (linkedElsewhere && linkedElsewhere.userId !== userId) {
      throw new StravaError(
        "STRAVA_ALREADY_LINKED",
        409,
        "Ce compte Strava est déjà relié à un autre compte 66Partners.",
      );
    }

    const values = {
      stravaAthleteId: athleteId,
      accessTokenEncrypted: encryptSecret(tokens.access_token),
      refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
      expiresAt: new Date(tokens.expires_at * 1000),
      scope: grantedScope.slice(0, 255),
      updatedAt: new Date(),
    };
    const [previous] = await db
      .select({ stravaAthleteId: stravaAccounts.stravaAthleteId })
      .from(stravaAccounts)
      .where(eq(stravaAccounts.userId, userId))
      .limit(1);
    await db
      .insert(stravaAccounts)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: stravaAccounts.userId, set: values });

    const isNewLink = previous?.stravaAthleteId !== athleteId;
    if (isNewLink) {
      const athleteName = [tokens.athlete?.firstname, tokens.athlete?.lastname].filter(Boolean).join(" ") || null;
      void notifyLinked(userId, athleteName);
    }

    return { userId, isNewLink };
  },

  /**
   * Jeton d'accès valide pour le membre : rafraîchi automatiquement auprès
   * de Strava s'il expire dans moins de 5 minutes.
   */
  async getValidStravaToken(userId: string): Promise<string> {
    const [account] = await db.select().from(stravaAccounts).where(eq(stravaAccounts.userId, userId)).limit(1);
    if (!account) {
      throw new StravaError("STRAVA_NOT_LINKED", 404, "Relie d'abord ton compte Strava.");
    }
    if (account.expiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS) {
      return decryptSecret(account.accessTokenEncrypted);
    }

    const tokens = await requestTokens({
      grant_type: "refresh_token",
      refresh_token: decryptSecret(account.refreshTokenEncrypted),
    });
    await db
      .update(stravaAccounts)
      .set({
        accessTokenEncrypted: encryptSecret(tokens.access_token),
        refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
        expiresAt: new Date(tokens.expires_at * 1000),
        updatedAt: new Date(),
      })
      .where(eq(stravaAccounts.userId, userId));
    return tokens.access_token;
  },

  async getStatus(userId: string) {
    const [account] = await db
      .select({ createdAt: stravaAccounts.createdAt })
      .from(stravaAccounts)
      .where(eq(stravaAccounts.userId, userId))
      .limit(1);
    return { linked: Boolean(account), linkedAt: account?.createdAt ?? null };
  },

  async getMeetingValidation(userId: string, activityId: string) {
    const [row] = await db
      .select({ stravaActivityId: stravaMeetingValidations.stravaActivityId })
      .from(stravaMeetingValidations)
      .where(and(eq(stravaMeetingValidations.activityId, activityId), eq(stravaMeetingValidations.userId, userId)))
      .limit(1);
    return row
      ? { validated: true, stravaUrl: `https://www.strava.com/activities/${row.stravaActivityId}` }
      : { validated: false, stravaUrl: null };
  },

  /** Révoque l'accès chez Strava (au mieux) puis oublie les jetons. */
  async disconnect(userId: string): Promise<void> {
    try {
      const token = await StravaService.getValidStravaToken(userId);
      await fetch(STRAVA_DEAUTHORIZE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Jetons déjà invalides ou Strava injoignable : on supprime quand même.
    }
    await db.delete(stravaAccounts).where(eq(stravaAccounts.userId, userId));
  },

  /**
   * « Valider notre rencontre » : retrouve l'activité Strava du membre
   * correspondant à la sortie 66Partners et y ajoute ses partenaires et la
   * marque du territoire.
   */
  async validateMeeting(userId: string, activityId: string) {
    const [activity] = await db
      .select({
        id: activities.id,
        startDate: activities.startDate,
        status: activities.status,
        creatorId: activities.creatorId,
        sportName: sports.name,
        brandName: territories.brandName,
      })
      .from(activities)
      .innerJoin(sports, eq(sports.id, activities.sportId))
      .innerJoin(territories, eq(territories.id, activities.territoryId))
      .where(eq(activities.id, activityId))
      .limit(1);
    if (!activity) throw new StravaError("ACTIVITY_NOT_FOUND", 404, "Activité introuvable.");
    if (activity.status === "CANCELLED") {
      throw new StravaError("ACTIVITY_CANCELLED", 409, "Cette activité a été annulée.");
    }

    const now = Date.now();
    const start = activity.startDate.getTime();
    if (start > now) {
      throw new StravaError("ACTIVITY_NOT_STARTED", 409, "Tu pourras valider la rencontre une fois la sortie commencée.");
    }
    if (now - start > MAX_VALIDATION_AGE_MS) {
      throw new StravaError("ACTIVITY_TOO_OLD", 409, "Cette sortie est trop ancienne pour être validée.");
    }

    const accepted = await db
      .select({ userId: participations.userId, pseudo: users.pseudo })
      .from(participations)
      .innerJoin(users, eq(users.id, participations.userId))
      .where(and(eq(participations.activityId, activityId), eq(participations.status, "ACCEPTED")));
    const members = [...accepted];
    if (activity.creatorId) {
      const [creator] = await db
        .select({ userId: users.id, pseudo: users.pseudo })
        .from(users)
        .where(eq(users.id, activity.creatorId))
        .limit(1);
      if (creator) members.unshift(creator);
    }
    if (!members.some((member) => member.userId === userId)) {
      throw new StravaError("NOT_A_MEMBER", 403, "Seuls les membres de la sortie peuvent valider la rencontre.");
    }
    const partners = members.filter((member) => member.userId !== userId).map((member) => member.pseudo);
    if (partners.length === 0) {
      throw new StravaError("NO_PARTNER", 409, "Personne ne t'a rejoint sur cette sortie : rien à valider.");
    }

    const [already] = await db
      .select({ stravaActivityId: stravaMeetingValidations.stravaActivityId })
      .from(stravaMeetingValidations)
      .where(and(eq(stravaMeetingValidations.activityId, activityId), eq(stravaMeetingValidations.userId, userId)))
      .limit(1);
    if (already) {
      throw new StravaError("ALREADY_VALIDATED", 409, "Tu as déjà validé cette rencontre.");
    }

    const token = await StravaService.getValidStravaToken(userId);
    const headers = { Authorization: `Bearer ${token}` };

    const searchUrl = new URL(`${STRAVA_API}/athlete/activities`);
    searchUrl.searchParams.set("after", String(Math.floor((start - SEARCH_BEFORE_MS) / 1000)));
    searchUrl.searchParams.set("before", String(Math.floor((start + SEARCH_AFTER_MS) / 1000)));
    searchUrl.searchParams.set("per_page", "30");
    const candidates = await stravaFetch<StravaActivitySummary[]>(
      searchUrl.toString(),
      { headers },
      "STRAVA_LIST_FAILED",
    );
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new StravaError(
        "STRAVA_ACTIVITY_NOT_FOUND",
        404,
        "Aucune activité Strava trouvée autour de l'heure de la sortie. Synchronise ta montre puis réessaie.",
      );
    }
    const match = candidates.reduce((best, candidate) =>
      Math.abs(new Date(candidate.start_date).getTime() - start) <
      Math.abs(new Date(best.start_date).getTime() - start)
        ? candidate
        : best,
    );

    const detail = await stravaFetch<StravaActivityDetail>(
      `${STRAVA_API}/activities/${match.id}`,
      { headers },
      "STRAVA_READ_FAILED",
    );
    const signature = `Rencontre réussie grâce à ${activity.brandName} ! 🤝`;
    const existing = (detail.description ?? "").trim();
    const description = existing.includes(signature) ? existing : [existing, signature].filter(Boolean).join("\n\n");
    const name = `Sortie ${activity.sportName.toLowerCase()} avec ${formatPartners(partners)}`.slice(0, 255);

    await stravaFetch<StravaActivityDetail>(
      `${STRAVA_API}/activities/${match.id}`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      },
      "STRAVA_UPDATE_FAILED",
    );

    await db.insert(stravaMeetingValidations).values({ activityId, userId, stravaActivityId: match.id });

    return {
      stravaActivityId: match.id,
      stravaUrl: `https://www.strava.com/activities/${match.id}`,
      name,
    };
  },
};
