import { useEffect, useRef, useState } from "react";
import { Play, Volume2 } from "lucide-react";

interface HowVideoProps {
  src: string;
  poster: string;
  brandName: string;
}

/**
 * Vidéo de présentation. Elle se lance quand elle arrive à l'écran, avec le
 * son si le navigateur l'autorise, sinon sans le son (bouton « Activer le
 * son »), et se met en pause quand on la quitte. Rien n'est téléchargé avant. Pas de lecture
 * automatique si le visiteur demande moins d'animations ou économise ses
 * données, ni après une pause manuelle ou une fin de lecture.
 */
export default function HowVideo({ src, poster, brandName }: HowVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  // Pause déclenchée par le défilement, à distinguer d'une pause du visiteur.
  const autoPausedRef = useRef(false);
  const userPausedRef = useRef(false);
  const finishedRef = useRef(false);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !("IntersectionObserver" in window)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reducedMotion || saveData) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!video.paused || userPausedRef.current || finishedRef.current) return;
          setStarted(true);
          const refused = (error: unknown) => error instanceof DOMException && error.name === "NotAllowedError";
          // Première arrivée : on tente avec le son. Les navigateurs ne
          // l'autorisent que si le visiteur a déjà touché ou cliqué la page ;
          // sinon on relance sans le son. Au retour, on garde le réglage choisi.
          if (!autoStartedRef.current) {
            autoStartedRef.current = true;
            video.muted = false;
          }
          video.play().catch((error: unknown) => {
            if (!refused(error)) return; // simple interruption par le défilement
            if (!video.muted) {
              video.muted = true;
              video.play().catch((retryError: unknown) => {
                if (refused(retryError)) setStarted(false);
              });
            } else {
              setStarted(false);
            }
          });
        } else if (!video.paused) {
          autoPausedRef.current = true;
          video.pause();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function start() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setStarted(true);
    // En cas de refus du navigateur, les contrôles natifs restent disponibles.
    video.play().catch(() => undefined);
  }

  function unmute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    if (video.paused) video.play().catch(() => undefined);
  }

  function handlePause() {
    const video = videoRef.current;
    if (autoPausedRef.current) {
      autoPausedRef.current = false;
      return;
    }
    if (video && !video.ended) userPausedRef.current = true;
  }

  function reset() {
    finishedRef.current = true;
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
        onPlay={() => {
          userPausedRef.current = false;
        }}
        onPause={handlePause}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
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
      ) : muted ? (
        <button type="button" className="how__video-unmute" onClick={unmute}>
          <Volume2 size={16} /> Activer le son
        </button>
      ) : null}
    </figure>
  );
}
