import axios from "axios";
import { ADMIN_TOKEN_STORAGE_KEY } from "./adminAccess";

// Instance dédiée à l'espace admin : indépendante de la session utilisateur
// (lib/axios.ts), elle porte le jeton admin plutôt que le token utilisateur.
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      if (window.location.pathname.startsWith("/admin")) {
        window.location.assign("/admin");
      }
    }
    return Promise.reject(error);
  },
);

export default adminApi;
