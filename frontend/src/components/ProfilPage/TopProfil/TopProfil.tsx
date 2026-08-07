import { useAuth } from "../../../contexts/AuthContext";
import "./TopProfil.scss";

export default function TopProfile() {
  const { user } = useAuth();
  const pseudo = user?.pseudo || "Nom";
  const city = user?.city || "Ville";

  return (
    <div className="container-topProfile">
      <h1 className="container-topProfile__h1">{pseudo}</h1>
      <h2 className="container-topProfile__h2">{city}</h2>
    </div>
  );
}
