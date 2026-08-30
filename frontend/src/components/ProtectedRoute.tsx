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
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
