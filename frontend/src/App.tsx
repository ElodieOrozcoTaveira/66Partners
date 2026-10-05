import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { TerritoryProvider } from "./contexts/TerritoryContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminAccessGate from "./components/AdminAccessGate";
import Home from "./pages/Home/Home";

// Code splitting par route (cf. audit performance — P1) : toutes les pages
// sauf la Home (point d'entrée quasi systématique d'un premier visiteur)
// sont chargées à la demande. Layout.tsx enveloppe déjà <Outlet /> dans le
// même <Suspense> que celui utilisé ici pour l'admin — un seul et même
// fallback, réutilisant le spinner déjà stylé de ProtectedRoute.scss.
const Sports = lazy(() => import("./pages/Sports/Sports"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const Pourquoi = lazy(() => import("./pages/Pourquoi66/Pourquoi"));
const Explorer = lazy(() => import("./pages/Explorer/Explorer"));
const Faq = lazy(() => import("./pages/FAQ/Faq"));
const Fonctionnement = lazy(() => import("./pages/Fonctionnement/Fonctionnement"));
const PolitiqueConfidentialite = lazy(() =>
  import("./pages/Confidentalité/Confidentialite").then((m) => ({
    default: m.PolitiqueConfidentialite,
  })),
);
const MentionsLegales = lazy(() =>
  import("./pages/MentionsLegales/MentionsLegales").then((m) => ({
    default: m.MentionsLegales,
  })),
);
const Profil = lazy(() => import("./pages/Profil/Profil"));
const UserProfil = lazy(() => import("./pages/UserProfil/UserProfil"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Messages = lazy(() => import("./pages/Messages/Messages"));
const PrivateMessage = lazy(() => import("./pages/Messages/PrivateMessage/PrivateMessage"));
const MesActivités = lazy(() => import("./pages/MesActivités/MesActivités"));
const CreerActivite = lazy(() => import("./pages/CreerActivite/CreerActivite"));
const DetailActivite = lazy(() => import("./pages/DetailActivite/DetailActivite"));
const MotDePasseOublie = lazy(() => import("./pages/MotDePasseOublie/MotDePasseOublie"));
const ReinitialiserMotDePasse = lazy(
  () => import("./pages/ReinitialiserMotDePasse/ReinitialiserMotDePasse"),
);
const AdminLogin = lazy(() => import("./pages/AdminLogin/AdminLogin"));
const AdminMotDePasseOublie = lazy(
  () => import("./pages/AdminMotDePasseOublie/AdminMotDePasseOublie"),
);
const AdminReinitialiserMotDePasse = lazy(
  () => import("./pages/AdminReinitialiserMotDePasse/AdminReinitialiserMotDePasse"),
);
const AdminStats = lazy(() => import("./pages/AdminStats/AdminStats"));
const AdminUsers = lazy(() => import("./pages/AdminUsers/AdminUsers"));
const AdminActivities = lazy(() => import("./pages/AdminActivities/AdminActivities"));
const AdminSettings = lazy(() => import("./pages/AdminSettings/AdminSettings"));

// Fallback minimal, identique au spinner déjà utilisé par ProtectedRoute
// pendant la résolution de l'auth — cohérent avec le design existant, pas de
// nouveau composant visuel introduit.
function RouteFallback() {
  return (
    <div className="protected-route-loading">
      <span className="protected-route-loading__spinner" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TerritoryProvider>
        <NotificationsProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Routes publiques */}
            <Route path="/" element={<Home/>} />
            <Route path="/sports" element={<Suspense fallback={<RouteFallback />}><Sports /></Suspense>} />
            <Route path="/pourquoi66" element={<Suspense fallback={<RouteFallback />}><Pourquoi /></Suspense>} />
            <Route path="/contact" element={<Suspense fallback={<RouteFallback />}><Contact /></Suspense>} />
            <Route path="/FAQ" element={<Suspense fallback={<RouteFallback />}><Faq /></Suspense>} />
            <Route path="/confidentialite" element={<Suspense fallback={<RouteFallback />}><PolitiqueConfidentialite/></Suspense>} />
            <Route path="/mentionslegales" element={<Suspense fallback={<RouteFallback />}><MentionsLegales/></Suspense>} />
            <Route path="/mot-de-passe-oublie" element={<Suspense fallback={<RouteFallback />}><MotDePasseOublie/></Suspense>} />
            <Route path="/reinitialiser-mot-de-passe" element={<Suspense fallback={<RouteFallback />}><ReinitialiserMotDePasse/></Suspense>} />

           <Route path="/fonctionnement" element={<Suspense fallback={<RouteFallback />}><Fonctionnement /></Suspense>} />                        {/*<Route path="/about" element= {<About />}*/}



            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/explorer" element={<Suspense fallback={<RouteFallback />}><Explorer /></Suspense>} />
              <Route path="/activities/:id" element={<Suspense fallback={<RouteFallback />}><DetailActivite/></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<RouteFallback />}><Profil/></Suspense>} />
              <Route path="/profile/:userId" element={<Suspense fallback={<RouteFallback />}><UserProfil/></Suspense>} />
              <Route path="/dashboard" element={<Suspense fallback={<RouteFallback />}><Dashboard/></Suspense>} />
              <Route path="/mesactivités" element={<Suspense fallback={<RouteFallback />}><MesActivités/></Suspense>} />
              <Route path="/mesactivités/nouvelle" element={<Suspense fallback={<RouteFallback />}><CreerActivite/></Suspense>} />
              <Route path="/messages" element={<Suspense fallback={<RouteFallback />}><Messages/></Suspense>} />
              <Route path="/messages/:activityId" element={<Suspense fallback={<RouteFallback />}><PrivateMessage/></Suspense>} />

            </Route>



            <Route path="*" element={<Suspense fallback={<RouteFallback />}><NotFound /></Suspense>} />
          </Route>

          {/* Interface admin : layout autonome, sans Header/Footer du site public.
              Accès protégé par mot de passe admin (indépendant du compte
              utilisateur) le temps qu'une vraie auth admin existe côté backend. */}
          <Route path="/admin" element={<Suspense fallback={<RouteFallback />}><AdminLogin /></Suspense>} />
          <Route path="/admin/mot-de-passe-oublie" element={<Suspense fallback={<RouteFallback />}><AdminMotDePasseOublie /></Suspense>} />
          <Route path="/admin/reinitialiser-mot-de-passe" element={<Suspense fallback={<RouteFallback />}><AdminReinitialiserMotDePasse /></Suspense>} />
          <Route element={<AdminAccessGate />}>
            <Route path="/admin/stats" element={<Suspense fallback={<RouteFallback />}><AdminStats /></Suspense>} />
            <Route path="/admin/utilisateurs" element={<Suspense fallback={<RouteFallback />}><AdminUsers /></Suspense>} />
            <Route path="/admin/activites" element={<Suspense fallback={<RouteFallback />}><AdminActivities /></Suspense>} />
            <Route path="/admin/settings" element={<Suspense fallback={<RouteFallback />}><AdminSettings /></Suspense>} />
          </Route>
        </Routes>
        </NotificationsProvider>
        </TerritoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
