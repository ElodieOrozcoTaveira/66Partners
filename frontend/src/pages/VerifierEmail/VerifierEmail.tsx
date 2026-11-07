import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import { useAuth } from "../../contexts/AuthContext";
import "../ReinitialiserMotDePasse/ReinitialiserMotDePasse.scss";
import "./VerifierEmail.scss";

type Status = "pending" | "done" | "error";

/** Page ouverte depuis le lien de confirmation reçu par email. */
export default function VerifierEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "pending" : "error");
  const [message, setMessage] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    api
      .post("/api/auth/verify-email", { token })
      .then(async () => {
        setStatus("done");
        await refreshUser().catch(() => false);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : "Impossible de confirmer ton adresse pour le moment.",
        );
      });
    // Une seule tentative par ouverture du lien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="reset-mdp">
      <div className="reset-mdp__card">
        {status === "pending" && (
          <>
            <span className="reset-mdp__icon">
              <LoaderCircle size={26} className="spin" />
            </span>
            <h1 className="reset-mdp__title">Confirmation en cours…</h1>
          </>
        )}

        {status === "done" && (
          <>
            <span className="reset-mdp__icon reset-mdp__icon--success">
              <CheckCircle2 size={26} />
            </span>
            <h1 className="reset-mdp__title">Adresse confirmée !</h1>
            <p className="reset-mdp__text">
              Merci ! Tu peux maintenant organiser tes sorties et retrouver des sportifs près de chez toi.
            </p>
            <Link
              to={user ? "/mesactivités/nouvelle" : "/"}
              className="reset-mdp__submit reset-mdp__submit--link"
            >
              {user ? "Organiser une sortie" : "Me connecter"}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <span className="reset-mdp__icon reset-mdp__icon--error">
              <ShieldAlert size={26} />
            </span>
            <h1 className="reset-mdp__title">Lien invalide ou expiré</h1>
            <p className="reset-mdp__text">
              {message ??
                "Ce lien de confirmation est incomplet ou n'est plus valable."}{" "}
              Connecte-toi : tu pourras demander un nouveau lien depuis ton espace.
            </p>
            <Link to={user ? "/dashboard" : "/"} className="reset-mdp__submit reset-mdp__submit--link">
              {user ? "Aller à mon espace" : "Retour à l'accueil"}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
