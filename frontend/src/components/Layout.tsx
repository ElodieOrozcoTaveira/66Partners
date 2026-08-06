import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import GoogleAnalytics from "./Analytics/Analytics";
import "./Layout.scss";
import CookieBanner from "./Cookie/Cookie";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <GoogleAnalytics/>
      <CookieBanner/>
      <Header/>
      <main>
        <div className="page-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Footer/>
    </div>
  );
}
