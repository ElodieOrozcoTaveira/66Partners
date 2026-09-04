import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./ProtectedRoute.scss";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <span className="protected-route-loading__spinner" />
      </div>
    );
  }
  // Plus de page /login dédiée : la connexion se fait via la modale
  // (Header/burger), donc on renvoie simplement vers l'accueil.
  if (!user) return <Navigate to="/" replace />;

  return <Outlet />;
}
