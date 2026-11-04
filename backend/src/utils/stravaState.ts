import crypto from "node:crypto";

/**
 * Paramètre `state` du flux OAuth Strava : identifie le membre au retour de
 * Strava (la redirection ne porte pas son jeton de connexion) et empêche
 * qu'un tiers relie son compte Strava au compte d'un autre membre.
 * Signé (HMAC-SHA256, JWT_SECRET), valable 10 minutes.
 */
const STATE_TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET manquant");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(`strava-oauth:${payload}`).digest("base64url");
}

export function createStravaState(userId: string, now = Date.now()): string {
  const payload = `${userId}.${now + STATE_TTL_MS}.${crypto.randomBytes(8).toString("hex")}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

/** Renvoie l'identifiant du membre, ou null si le state est invalide ou expiré. */
export function readStravaState(state: string, now = Date.now()): string | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = sign(payload);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }
  const [userId, expiresAt] = payload.split(".");
  if (!userId || !expiresAt || Number(expiresAt) < now) return null;
  return userId;
}
