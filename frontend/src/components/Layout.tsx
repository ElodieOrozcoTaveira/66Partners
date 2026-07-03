import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header/Header";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <Header/>
      <main>
        <Outlet />
      </main>
    </>
  );
}
