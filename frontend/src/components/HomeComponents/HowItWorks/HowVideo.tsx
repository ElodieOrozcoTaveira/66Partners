import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface HowVideoProps {
  src: string;
  poster: string;
  brandName: string;
}

/** Vidéo de présentation : rien n'est téléchargé avant le clic sur lecture. */
export default function HowVideo({ src, poster, brandName }: HowVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  function start() {
    setStarted(true);
    // En cas de refus du navigateur, les contrôles natifs restent disponibles.
    videoRef.current?.play().catch(() => undefined);
  }

  function reset() {
    setStarted(false);
    // Recharge l'élément pour réafficher l'image d'aperçu en fin de lecture.
    videoRef.current?.load();
  }

  return (
    <figure className="how__video">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="none"
        playsInline
        controls={started}
        onEnded={reset}
        aria-label={`Vidéo de présentation de ${brandName}`}
      />
      {!started ? (
        <button type="button" className="how__video-play" onClick={start}>
          <span className="how__video-icon">
            <Play size={24} fill="currentColor" />
          </span>
          <span className="how__video-label">Voir la vidéo · 49 s</span>
        </button>
      ) : null}
    </figure>
  );
}
