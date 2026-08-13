import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Nécessaire pour que le dev server accepte les requêtes arrivant via
    // un tunnel ngrok (Host header différent de localhost).
    allowedHosts: true,
    proxy: {
      "/api": {
        // Par défaut en dev local, on proxie vers le backend local.
        // Si vous utilisez Docker compose, définissez l'env `VITE_DEV_PROXY_TARGET`
        // à "http://api:3000" pour pointer sur le service docker.
        target: process.env.VITE_DEV_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_DEV_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
