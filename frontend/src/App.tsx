import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
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


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Routes publiques */}
            <Route path="/" element={<Home/>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/pourquoi66" element={<Pourquoi />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/FAQ" element={<Faq />} />
            <Route path="/confidentialite" element={<PolitiqueConfidentialite/>} />
            <Route path="/mentionslegales" element={<MentionsLegales/>} />

           <Route path="/fonctionnement" element= {<Fonctionnement />} />                        {/*<Route path="/about" element= {<About />}*/}



            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/activities" element={<div>Activités — Phase 4</div>} />
              <Route path="/profile" element={<Profil/>} />
            </Route>
          
            

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
