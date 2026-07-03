import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import NotFound from "./pages/NotFound/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
           {/* <Route path="/sports" element= {<Sports />} />
            <Route path="/howsworking" element= {<Howsworking />} />                        <Route path="/about" element= {<About />}*/} 



            {/* Routes protégées */}
            <Route element={<ProtectedRoute />}>
              <Route path="/activities" element={<div>Activités — Phase 4</div>} />
              <Route path="/profile" element={<div>Profil — Phase 3</div>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
