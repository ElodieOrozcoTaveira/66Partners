import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { isAxiosError } from "axios";
import { deleteMyAccount } from "../../../api/accountDeletion";
import { useAuth } from "../../../contexts/AuthContext";
import ConfirmDialog from "../../ConfirmDialog/ConfirmDialog";
import "./CompteDanger.scss";

export default function CompteDanger() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteMyAccount();
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible de supprimer le compte pour le moment. Réessaie plus tard.";
      setError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container-compteDanger">
      <h2>Compte</h2>
      <div className="compteDanger-card">
        <div className="compteDanger-card__text">
          <h3>Supprimer mon compte</h3>
          <p>
            Cette action est irréversible. Ton compte et tes données personnelles seront
            définitivement supprimés.
          </p>
        </div>
        <button
          type="button"
          className="compteDanger-card__button"
          onClick={() => setIsDialogOpen(true)}
        >
          <Trash2 size={16} strokeWidth={2.2} />
          Supprimer mon compte
        </button>
      </div>

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="Supprimer définitivement ton compte ?"
        description="Cette action est irréversible. Ton compte et les données personnelles associées seront supprimés. Les activités que tu as créées resteront visibles pour les autres participants, sans toi comme organisateur."
        isSubmitting={isSubmitting}
        errorMessage={error}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDialogOpen(false);
          setError(null);
        }}
      />
    </div>
  );
}
