import { MapPin } from "lucide-react";
import type { User } from "../../../contexts/AuthContext";
import "./TopProfil.scss";

interface TopProfileProps {
  user: Pick<User, "pseudo" | "city"> | null;
  isOwnProfile?: boolean;
}

export default function TopProfile({ user }: TopProfileProps) {
  const pseudo = user?.pseudo || "Nom";
  const city = user?.city || "Ville";

  return (
    <div className="container-topProfile">
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
