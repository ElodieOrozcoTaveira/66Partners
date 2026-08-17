import { NavLink } from "react-router-dom";
import "./ProfilCard.scss";

interface ProfilCardProps {
  pseudo: string;
  city: string | null;
  avatar: string | null;
}

export default function ProfilCard({ pseudo, city, avatar }: ProfilCardProps) {
  return (
    <NavLink to="/profile" className="container-profilcard">
      <img
        src={avatar || "/montagne.webp"}
        alt={`Photo de profil de ${pseudo}`}
        className="container-profilcard__avatar"
      />
      <div className="container-profilcard__info">
        <span className="container-profilcard__pseudo">{pseudo}</span>
        <span className="container-profilcard__city">
          {city || "Ville non renseignée"}
        </span>
      </div>
    </NavLink>
  );
}
