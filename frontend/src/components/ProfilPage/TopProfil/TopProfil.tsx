import { useState } from "react";
import { MapPin, Pen } from "lucide-react";
import type { User } from "../../../contexts/AuthContext";
import ModaleEditProfil from "../ModaleEditProfil/ModaleEditProfil";
import "./TopProfil.scss";

interface TopProfileProps {
  user: Pick<User, "pseudo" | "city"> | null;
  isOwnProfile?: boolean;
}

export default function TopProfile({ user, isOwnProfile = true }: TopProfileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const pseudo = user?.pseudo || "Nom";
  const city = user?.city || "Ville";

  return (
    <div className="container-topProfile">
      {isOwnProfile && (
        <div className="container-topProfile__actions">
          <button
            type="button"
            className="container-topProfile__edit"
            onClick={() => setIsEditOpen(true)}
          >
            <Pen size={13} strokeWidth={2.2} />
            <span>Modifier le profil</span>
          </button>

          <ModaleEditProfil
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />
        </div>
      )}

      <div className="container-topProfile__info">
        <h1 className="container-topProfile__h1">{pseudo}</h1>
        <h2 className="container-topProfile__h2">
          <MapPin size={12} strokeWidth={2.4} />
          {city}
        </h2>
      </div>
    </div>
  );
}
