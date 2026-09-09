import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Pen } from "lucide-react";
import { useAuth, type User } from "../../../contexts/AuthContext";
import api from "../../../lib/axios";
import ImageCropModal from "../ImageCropModal/ImageCropModal";
import ModaleEditProfil from "../ModaleEditProfil/ModaleEditProfil";
import Hamburger from "../../BurgerComponent/Hamburger/Hamburger";
import "./HeroProfile.scss";

interface HeroProfileProps {
  user: Pick<User, "avatar" | "pseudo" | "coverPhoto"> | null;
  isOwnProfile?: boolean;
}

type CropTarget = "avatar" | "cover";

const CROP_CONFIG: Record<
  CropTarget,
  {
    aspect: number;
    cropShape: "round" | "rect";
    outputSize: { width: number; height: number };
    title: string;
  }
> = {
  avatar: {
    aspect: 1,
    cropShape: "round",
    outputSize: { width: 400, height: 400 },
    title: "Recadrer la photo de profil",
  },
  cover: {
    aspect: 3,
    cropShape: "rect",
    outputSize: { width: 1200, height: 400 },
    title: "Recadrer la photo de couverture",
  },
};

export default function HeroProfile({ user, isOwnProfile = true }: HeroProfileProps) {
  const { refreshUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // Modification de la photo de couverture désactivée pour l'instant (cf. plus bas).
  // const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<CropTarget | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{ target: CropTarget; src: string } | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);

  const avatarSrc = user?.avatar || "/avatardefault.webp";
  const coverSrc = user?.coverPhoto || "/couverture.webp";
  // Le cadrage "center" reste la seule option sûre pour une photo perso (on
  // ne sait pas où se trouve le sujet) : le recadrage spécifique laptop/desktop
  // (pic du Canigou + mer, sans le logo) ne s'applique qu'à la couverture par
  // défaut, dont la composition est connue.
  const hasDefaultCover = !user?.coverPhoto;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, target: CropTarget) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPendingCrop({ target, src: URL.createObjectURL(file) });
  }

  function closeCropModal() {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.src);
    setPendingCrop(null);
  }

  async function handleCropValidate(blob: Blob) {
    if (!pendingCrop) return;
    const { target } = pendingCrop;
    const endpoint =
      target === "avatar" ? "/api/users/me/avatar" : "/api/users/me/cover-photo";
    const formData = new FormData();
    formData.append("file", blob, `${target}.jpg`);

    setIsUploading(target);
    try {
      await api.post(endpoint, formData, {
        headers: { "Content-Type": undefined },
      });
      await refreshUser();
      closeCropModal();
    } catch (error) {
      console.error(`Impossible d'envoyer la photo (${target})`, error);
      window.alert("La photo n'a pas pu être envoyée.");
    } finally {
      setIsUploading(null);
    }
  }

  return (
    <>
    <section
      className={`hero-profile${hasDefaultCover ? " hero-profile--defaultCover" : ""}`}
      style={coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined}
    >
      <div className="hero-profile__menu">
        <Hamburger />
      </div>

      {/*
        Modification de la photo de couverture désactivée pour l'instant.
        Décommenter ce bloc (+ `coverInputRef` plus haut) pour la réactiver.

        {isOwnProfile && (
          <>
            <button
              type="button"
              className="hero-profile__coverEdit"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading !== null}
              aria-label="Modifier la photo de couverture"
            >
              <Camera size={15} strokeWidth={2.2} />
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => handleFileChange(event, "cover")}
            />
          </>
        )}
      */}

      <div className="hero-profile__avatar-wrap">
        <img
          src={avatarSrc}
          alt={user ? `Photo de profil de ${user.pseudo}` : "Photo de profil"}
          className="hero-profile__img"
        />
        {isOwnProfile && (
          <>
            <button
              type="button"
              className="hero-profile__avatarEdit"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploading !== null}
              aria-label="Modifier la photo de profil"
            >
              <Camera size={14} strokeWidth={2.2} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => handleFileChange(event, "avatar")}
            />
          </>
        )}
      </div>

      <div className="hero-profile__content" />
    </section>

    {/*
      Toujours rendu (même sans le bouton) : sa margin-top compense le
      chevauchement de l'avatar sur la couverture, donc TopProfile en a
      besoin dans les deux cas pour ne pas se retrouver sous la photo.
    */}
    <div className="hero-profile__editRow">
      {isOwnProfile && (
        <button
          type="button"
          className="hero-profile__editProfile"
          onClick={() => setIsEditOpen(true)}
        >
          <Pen size={13} strokeWidth={2.2} />
          Modifier le profil
        </button>
      )}
    </div>

    {isOwnProfile && (
      <ModaleEditProfil isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    )}

    {pendingCrop && (
      <ImageCropModal
        imageSrc={pendingCrop.src}
        aspect={CROP_CONFIG[pendingCrop.target].aspect}
        cropShape={CROP_CONFIG[pendingCrop.target].cropShape}
        outputSize={CROP_CONFIG[pendingCrop.target].outputSize}
        title={CROP_CONFIG[pendingCrop.target].title}
        isSaving={isUploading !== null}
        onCancel={closeCropModal}
        onValidate={handleCropValidate}
      />
    )}
    </>
  );
}
