import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      // Service worker écrit à la main (src/sw.ts) plutôt que généré : c'est
      // le seul moyen d'y ajouter nos propres listeners `push` /
      // `notificationclick` (le mode generateSW ne laisse pas la main dessus).
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      // Actif aussi en dev pour pouvoir tester l'installation sans build de prod.
      devOptions: { enabled: true, type: "module" },
      manifest: {
        name: "66Partners",
        short_name: "66Partners",
        description:
          "66Partners connecte les sportifs des Pyrénées-Orientales : trouve un partenaire, crée ou rejoins une activité sportive près de chez toi.",
        lang: "fr",
        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#E6392E",
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/pwa-icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        // Le bundle du service worker n'a pas besoin d'être minifié pour le
        // debug en dev ; en prod, esbuild s'en charge comme pour le reste.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
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
