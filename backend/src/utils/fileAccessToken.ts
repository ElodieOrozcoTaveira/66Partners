import crypto from "node:crypto";

/**
 * JETONS D'ACCÈS AUX FICHIERS PROTÉGÉS (photos d'activité)
 *
 * Le token voyage dans l'URL (`?token=...`), pas dans un header, afin de
 * rester compatible avec une balise <img src> classique tout en restreignant
 * l'accès aux participants — cf. chantier RGPD F-02.
 *
 * Le nom de fichier fait partie du message signé : un token émis pour la
 * photo A est donc structurellement invalide pour la photo B, même s'il n'a
 * pas expiré.
 */

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes : largement suffisant pour charger une image, réduit la fenêtre de partage d'un lien.

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET manquant : impossible de signer les URLs de fichiers");
  }
  return secret;
}

function sign(filename: string, expires: number): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${filename}:${expires}`)
    .digest("hex");
}

/** Ajoute un jeton d'accès signé et à courte durée de vie à une URL `/uploads/<filename>`. */
export function signFileUrl(url: string): string {
  const filename = url.split("/").pop();
  if (!filename) return url;

  const expires = Date.now() + TOKEN_TTL_MS;
  const token = `${expires}.${sign(filename, expires)}`;

  return `${url}?token=${token}`;
}

/**
 * Vérifie qu'un jeton est valide pour CE fichier précis, non expiré, avec
 * une comparaison de signature en temps constant.
 */
export function verifyFileToken(filename: string, token: string | undefined): boolean {
  if (!token) return false;

  const separatorIndex = token.indexOf(".");
  if (separatorIndex === -1) return false;

  const expiresRaw = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expires = Number(expiresRaw);

  if (!Number.isFinite(expires) || expires <= 0 || !signature) return false;
  if (Date.now() > expires) return false;

  const expectedHex = sign(filename, expires);

  let provided: Buffer;
  let expected: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }

  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}
