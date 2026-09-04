import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminAccessGranted } from "../lib/adminAccess";

export default function AdminAccessGate() {
  const location = useLocation();

  if (!isAdminAccessGranted()) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
