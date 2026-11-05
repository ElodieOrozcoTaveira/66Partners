/** Côté le plus long d'une photo envoyée (largement suffisant à l'écran). */
const MAX_SIDE = 2048;
/** Sous ce poids, une photo JPEG/PNG/WebP déjà raisonnable est envoyée telle quelle. */
const SKIP_UNDER_BYTES = 900 * 1024;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    image.src = url;
  });
}

/**
 * Réduit une photo avant l'envoi (2048 px au plus, JPEG) : les photos de
 * téléphone font souvent 3 à 8 Mo, et les HEIC d'iPhone sont converties en
 * JPEG (format accepté par le serveur). En cas d'échec, le fichier d'origine
 * est renvoyé tel quel.
 */
export async function compressImage(file: File): Promise<File> {
  if (PASSTHROUGH_TYPES.has(file.type) && file.size <= SKIP_UNDER_BYTES) return file;
  try {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size === 0) return file;
    if (PASSTHROUGH_TYPES.has(file.type) && blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
