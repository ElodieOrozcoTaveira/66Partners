import crypto from "node:crypto";

/**
 * Chiffrement symétrique (AES-256-GCM) des secrets stockés en base (jetons
 * Strava). Clé : STRAVA_TOKEN_ENCRYPTION_KEY, 32 octets encodés en base64
 * (générer avec `openssl rand -base64 32`). Format stocké :
 * base64(iv).base64(tag).base64(chiffré).
 */
function getKey(): Buffer {
  const raw = process.env.STRAVA_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error("STRAVA_TOKEN_ENCRYPTION_KEY manquant");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("STRAVA_TOKEN_ENCRYPTION_KEY doit faire 32 octets (base64)");
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string {
  const [iv, tag, encrypted] = stored.split(".").map((part) => Buffer.from(part, "base64"));
  if (!iv || !tag || !encrypted) throw new Error("Secret chiffré invalide");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
