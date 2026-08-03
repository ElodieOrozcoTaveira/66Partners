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
        target: "http://api:3000",
        changeOrigin: true,
      },
    },
  },
});
