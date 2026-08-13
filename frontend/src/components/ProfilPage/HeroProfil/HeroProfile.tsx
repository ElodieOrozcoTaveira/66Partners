import { useRef, useState, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { useAuth, type User } from "../../../contexts/AuthContext";
import api from "../../../lib/axios";
import "./HeroProfile.scss";

interface HeroProfileProps {
  user: Pick<User, "avatar" | "pseudo" | "coverPhoto"> | null;
  isOwnProfile?: boolean;
}

export default function HeroProfile({ user, isOwnProfile = true }: HeroProfileProps) {
  const { refreshUser } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<"avatar" | "cover" | null>(null);

  const avatarSrc = user?.avatar || "/montagne.webp";
  const coverSrc = user?.coverPhoto;

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    target: "avatar" | "cover",
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const endpoint =
      target === "avatar" ? "/api/users/me/avatar" : "/api/users/me/cover-photo";
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(target);
    try {
      await api.post(endpoint, formData, {
        headers: { "Content-Type": undefined },
      });
      await refreshUser();
    } catch (error) {
      console.error(`Impossible d'envoyer la photo (${target})`, error);
      window.alert("La photo n'a pas pu être envoyée.");
    } finally {
      setIsUploading(null);
    }
  }

  return (
    <section
      className="hero-profile"
      style={coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined}
    >
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
  );
}
