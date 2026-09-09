import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import BottomNavBar from "./BottomNavBar/BottomNavBar";
import GoogleAnalytics from "./Analytics/Analytics";
import "./Layout.scss";
import CookieBanner from "./Cookie/Cookie";
import InstallPwaPrompt from "./InstallPwaPrompt/InstallPwaPrompt";

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
  // Sur ces deux écrans, un élément fixe reste ancré en bas de la fenêtre
  // (compositeur de messages, CTA "Publier") : le bandeau d'installation ne
  // doit jamais s'empiler par-dessus (cf. audit PWA — P0).
  const hideInstallPrompt = isMessagesThread || isCreateActivity;

  // Le navigateur restaure lui-même sa position de scroll sur back/forward
  // (history.scrollRestoration = "auto" par défaut) : désactivé une seule
  // fois pour laisser l'effet ci-dessous décider seul, de façon cohérente
  // sur toute navigation (retour inclus).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Solution centralisée (routing/layout) plutôt que page par page : chaque
  // changement de route (pathname — pas la query string ni le hash) remonte
  // en haut du document. N'affecte que le scroll de la fenêtre, jamais le
  // scroll interne des modales ou conteneurs à défilement propre (ex. fil de
  // messages), qui ne passent jamais par window.scrollTo.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
      {!hideInstallPrompt && <InstallPwaPrompt hasBottomNav={showBottomNav} />}
    </div>
  );
}
