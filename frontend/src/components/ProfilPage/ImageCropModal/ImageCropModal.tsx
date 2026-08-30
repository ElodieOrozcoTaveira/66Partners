import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedImageBlob } from "./cropImage";
import "./ImageCropModal.scss";

interface ImageCropModalProps {
  imageSrc: string;
  aspect: number;
  cropShape: "round" | "rect";
  outputSize: { width: number; height: number };
  title: string;
  isSaving: boolean;
  onCancel: () => void;
  onValidate: (blob: Blob) => void;
}

export default function ImageCropModal({
  imageSrc,
  aspect,
  cropShape,
  outputSize,
  title,
  isSaving,
  onCancel,
  onValidate,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleValidate() {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, outputSize);
    onValidate(blob);
  }

  return createPortal(
    <div className="image-crop-overlay">
      <div className="image-crop-content" role="dialog" aria-modal="true">
        <button
          type="button"
          className="image-crop-content__close"
          onClick={onCancel}
          aria-label="Annuler"
          disabled={isSaving}
        >
          <X size={20} />
        </button>

        <h3 className="image-crop-content__title">{title}</h3>

        <div className="image-crop-content__stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={cropShape === "rect"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="image-crop-content__zoom">
          <ZoomOut size={16} />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom"
          />
          <ZoomIn size={16} />
        </div>

        <div className="image-crop-content__actions">
          <button
            type="button"
            className="image-crop-content__cancel"
            onClick={onCancel}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="button"
            className="image-crop-content__submit"
            onClick={handleValidate}
            disabled={isSaving || !croppedAreaPixels}
          >
            {isSaving ? "Enregistrement..." : "Valider"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
