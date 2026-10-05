import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Sous-ensembles latin + latin-ext uniquement (couvrent le français et le
// catalan, y compris ŀ) : le fichier générique (ex. "400.css") embarque en
// plus cyrillic/cyrillic-ext/greek/greek-ext/vietnamese, jamais utilisés par
// 66Partners mais tout de même précachés intégralement par le service worker
// (cf. audit performance — P0 #3).
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-ext-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-ext-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/manrope/latin-ext-800.css";
import './styles/global/global.scss'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
