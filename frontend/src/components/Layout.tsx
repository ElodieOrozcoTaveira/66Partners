import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import GoogleAnalytics from "./Analytics/Analytics";
import "./Layout.scss";
import CookieBanner from "./Cookie/Cookie";

export default function Layout() {
  const location = useLocation();
  const shouldShowFooter =
    !location.pathname.startsWith("/profile") &&
    !location.pathname.startsWith("/dashboard");

  return (
    <div className="app-shell">
      <GoogleAnalytics />
      <CookieBanner />
      <Header />
      <main>
        <div className="page-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
}
