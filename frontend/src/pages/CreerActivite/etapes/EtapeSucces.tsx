import { PartyPopper, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EtapeSuccesProps {
  title: string;
}

export default function EtapeSucces({ title }: EtapeSuccesProps) {
  const navigate = useNavigate();

  async function handleShare() {
    const shareData = {
      title: "66Partners",
      text: `Rejoins-moi pour "${title}" sur 66Partners !`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* partage annulé par l'utilisateur */
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.text);
      window.alert("Le message a été copié dans le presse-papiers.");
    } catch {
      window.alert("Impossible de partager l'activité pour le moment.");
    }
  }

  return (
    <div className="etape-succes">
      <div className="etape-succes__icon">
        <PartyPopper size={44} strokeWidth={1.8} />
      </div>

      <h1 className="etape-succes__title">Votre activité est créée avec succès !</h1>
      <p className="etape-succes__subtitle">
        Les participants seront notifiés et pourront vous rejoindre.
      </p>

      <div className="etape-succes__actions">
        <button
          type="button"
          className="etape-succes__btn etape-succes__btn--primary"
          onClick={() => navigate("/mesactivités", { state: { tab: "CREEES" } })}
        >
          Voir mon activité
        </button>
        <button
          type="button"
          className="etape-succes__btn etape-succes__btn--ghost"
          onClick={handleShare}
        >
          <Share2 size={16} />
          Partager l'activité
        </button>
      </div>
    </div>
  );
}
