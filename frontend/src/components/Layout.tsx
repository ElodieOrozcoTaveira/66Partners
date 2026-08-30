import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import BottomNavBar from "./BottomNavBar/BottomNavBar";
import GoogleAnalytics from "./Analytics/Analytics";
import "./Layout.scss";
import CookieBanner from "./Cookie/Cookie";

export default function Layout() {
  const location = useLocation();
  const pathname = decodeURIComponent(location.pathname);
  // Ces deux pages intègrent leur propre menu burger dans la photo de
  // couverture, mais seulement en mobile : à partir de la tablette, le
  // Header reprend la main avec sa navigation visible (cf. Header.scss).
  const hidesHeaderOnMobile =
    pathname.startsWith("/profile") || pathname.startsWith("/dashboard");
  const isAppRoute =
    hidesHeaderOnMobile ||
    pathname.startsWith("/mesactivités") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/activities");
  // Ces deux vues remplacent la bottom nav par leur propre en-tête/composer.
  const isMessagesThread = /^\/messages\/[^/]+$/.test(pathname);
  const isCreateActivity = pathname.startsWith("/mesactivités/nouvelle");
  const showBottomNav = isAppRoute && !isMessagesThread && !isCreateActivity;

  return (
    <div className="app-shell">
      <GoogleAnalytics />
      <CookieBanner />
      <Header hideOnMobile={hidesHeaderOnMobile} />
      <main>
        <div className="page-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      {showBottomNav && <BottomNavBar />}
      <Footer hideOnMobile={isAppRoute} />
    </div>
  );
}
