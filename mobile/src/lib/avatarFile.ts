/**
 * Prépare la photo choisie pour POST /users/me/avatar (multer côté serveur :
 * JPEG, PNG, WebP ou GIF, 5 Mo maximum — backend/src/middlewares/upload.middleware.ts).
 */

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
}

export type AvatarFile = { uri: string; name: string; type: string };

/** Fichier prêt à envoyer, ou message d'erreur lisible. */
export function toAvatarFile(image: PickedImage): AvatarFile | { error: string } {
  // Le sélecteur renvoie du JPEG après recadrage ; sans type connu, on le suppose.
  const type = (image.mimeType ?? "image/jpeg").toLowerCase();
  const extension = EXTENSIONS[type];
  if (!extension) {
    return { error: "Format non pris en charge. Choisis une photo JPEG, PNG ou WebP." };
  }
  if (image.fileSize && image.fileSize > AVATAR_MAX_BYTES) {
    return { error: "Cette photo est trop lourde (5 Mo maximum)." };
  }
  return { uri: image.uri, name: `avatar.${extension}`, type };
}
