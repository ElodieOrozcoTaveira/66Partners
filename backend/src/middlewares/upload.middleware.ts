import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * Résout un nom de fichier (segment unique, sans séparateur) vers un chemin
 * absolu STRICTEMENT contenu dans UPLOAD_DIR. Renvoie null pour tout nom de
 * fichier vide, contenant un séparateur, ou égal à "." / "..".
 *
 * Garde-fou anti path traversal : à utiliser pour toute lecture ou
 * suppression d'un fichier uploadé à partir d'une valeur venant du client
 * ou de la base (le nom de fichier fait partie de l'URL stockée).
 */
export function resolveUploadPath(filename: string | undefined | null): string | null {
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return null;
  }
  if (filename === "." || filename === "..") {
    return null;
  }

  const resolved = path.join(UPLOAD_DIR, filename);
  const uploadDirWithSep = UPLOAD_DIR.endsWith(path.sep) ? UPLOAD_DIR : `${UPLOAD_DIR}${path.sep}`;

  if (!resolved.startsWith(uploadDirWithSep)) {
    return null;
  }

  return resolved;
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new Error("Format d'image non supporté"));
      return;
    }
    callback(null, true);
  },
});
