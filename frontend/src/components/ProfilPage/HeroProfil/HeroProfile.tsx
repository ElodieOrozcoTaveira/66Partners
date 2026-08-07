import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/axios";
import { Pen } from "lucide-react";
import "./HeroProfile.scss";

export default function HeroProfile() {
  const { user, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const avatarSrc = user?.avatar || "/montagne.webp";

  async function handleAvatarClick() {
    const nextUrl = window.prompt(
      "Colle l’URL de la nouvelle photo de profil :",
    );
    if (!nextUrl || !nextUrl.trim()) return;

    setIsUpdating(true);
    try {
      await api.patch("/api/users/me", { avatar: nextUrl.trim() });
      await refreshUser();
    } catch (error) {
      console.error("Impossible de mettre à jour l’avatar", error);
      window.alert("La photo n’a pas pu être enregistrée.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="hero-profile">
      <div className="hero-profile__avatar-wrap">
        <img
          src={avatarSrc}
          alt={user ? `Photo de profil de ${user.pseudo}` : "Photo de profil"}
          className="hero-profile__img"
        />
        <button
          type="button"
          className="hero-profile__badge"
          aria-label="Ajouter ou modifier la photo de profil"
          onClick={handleAvatarClick}
          disabled={isUpdating}
        >
          <Pen color="#ffffff" size={16} strokeWidth={2.2} />
        </button>
      </div>

      <div className="hero-profile__content" />
    </section>
  );
}
