import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./EnTete.scss";

export default function EnTete() {
  const navigate = useNavigate();

  return (
    <header className="entete-activites">
      <h1 className="entete-activites__title">Activités</h1>
      <button
        type="button"
        className="entete-activites__add"
        onClick={() => navigate("/mesactivités/nouvelle")}
        aria-label="Créer une activité"
      >
        <Plus size={20} strokeWidth={2.4} />
      </button>
    </header>
  );
}
