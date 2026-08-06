import "./HeroProfile.scss";
import { useAuth } from "../../../contexts/AuthContext";
import { Pen } from "lucide-react";

export default function HeroProfile() {
  const { user } = useAuth();
  const avatarSrc = user?.avatar || "/montagne.webp";

  return (
    <section className="hero-profile">
      <div className="hero-profile__avatar-wrap">
        <img
          src={avatarSrc}
          alt={user ? `Photo de profil de ${user.pseudo}` : "Photo de profil"}
          className="hero-profile__img"
        />
        <span className="hero-profile__badge" aria-hidden="true">
          <Pen color="#ffffff" size={16} strokeWidth={2.2} />
        </span>
      </div>

      <div className="hero-profile__content" />
    </section>
  );
}
