import type { Area } from "react-easy-crop";

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // `src` est toujours une blob: URL locale (URL.createObjectURL du fichier
    // choisi) — jamais une ressource distante. `crossOrigin="anonymous"` n'a
    // aucune utilité ici et peut, sur certains navigateurs mobiles, faire
    // échouer le chargement ou marquer le canvas comme "tainted" (toBlob
    // produit alors un blob vide/inutilisable sans lever d'erreur visible).
    image.src = src;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  cropAreaPixels: Area,
  outputSize: { width: number; height: number },
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible de créer le contexte de recadrage.");
  }

  ctx.drawImage(
    image,
    cropAreaPixels.x,
    cropAreaPixels.y,
    cropAreaPixels.width,
    cropAreaPixels.height,
    0,
    0,
    outputSize.width,
    outputSize.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Un canvas "tainted" (sécurité) ou une erreur de décodage renvoie
        // parfois un blob non-null mais vide plutôt qu'un rejet explicite —
        // un tel blob s'uploaderait "avec succès" pour finir en image
        // cassée. Rejeter ici évite d'envoyer un avatar inutilisable.
        if (blob && blob.size > 0) resolve(blob);
        else reject(new Error("Le recadrage de l'image a échoué."));
      },
      "image/jpeg",
      0.92,
    );
  });
}
