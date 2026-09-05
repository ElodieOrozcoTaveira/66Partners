import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { TerritoryProvider } from "./contexts/TerritoryContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminAccessGate from "./components/AdminAccessGate";
import Home from "./pages/Home/Home";
import Sports from "./pages/Sports/Sports";
import Contact from "./pages/Contact/Contact";
import NotFound from "./pages/NotFound/NotFound";
import Pourquoi from "./pages/Pourquoi66/Pourquoi";
import Explorer from "./pages/Explorer/Explorer";
import Faq from "./pages/FAQ/Faq";
import Fonctionnement from "./pages/Fonctionnement/Fonctionnement";
import { PolitiqueConfidentialite } from "./pages/Confidentalité/Confidentialite";
import { MentionsLegales } from "./pages/MentionsLegales/MentionsLegales";
import Profil from "./pages/Profil/Profil";
import UserProfil from "./pages/UserProfil/UserProfil";
import Dashboard from "./pages/Dashboard/Dashboard";
import Messages from "./pages/Messages/Messages";
import PrivateMessage from "./pages/Messages/PrivateMessage/PrivateMessage";
import MesActivités from "./pages/MesActivités/MesActivités";
import CreerActivite from "./pages/CreerActivite/CreerActivite";
import DetailActivite from "./pages/DetailActivite/DetailActivite";
import MotDePasseOublie from "./pages/MotDePasseOublie/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse/ReinitialiserMotDePasse";
import AdminLogin from "./pages/AdminLogin/AdminLogin";
import AdminStats from "./pages/AdminStats/AdminStats";
import AdminSettings from "./pages/AdminSettings/AdminSettings";


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
            <Route path="/sports" element={<Sports />} />
            <Route path="/pourquoi66" element={<Pourquoi />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/FAQ" element={<Faq />} />
            <Route path="/confidentialite" element={<PolitiqueConfidentialite/>} />
            <Route path="/mentionslegales" element={<MentionsLegales/>} />
            <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie/>} />
            <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse/>} />

           <Route path="/fonctionnement" element= {<Fonctionnement />} />                        {/*<Route path="/about" element= {<About />}*/}



            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/activities/:id" element={<DetailActivite/>} />
              <Route path="/profile" element={<Profil/>} />
              <Route path="/profile/:userId" element={<UserProfil/>} />
              <Route path="/dashboard" element={<Dashboard/>} />
              <Route path="/mesactivités" element={<MesActivités/>} />
              <Route path="/mesactivités/nouvelle" element={<CreerActivite/>} />
              <Route path="/messages" element={<Messages/>} />
              <Route path="/messages/:activityId" element={<PrivateMessage/>} />

            </Route>
          
            

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Interface admin : layout autonome, sans Header/Footer du site public.
              Accès protégé par mot de passe admin (indépendant du compte
              utilisateur) le temps qu'une vraie auth admin existe côté backend. */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<AdminAccessGate />}>
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        </NotificationsProvider>
        </TerritoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
