import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "", // chaîne vide = requêtes relatives
  headers: { "Content-Type": "application/json" },
  // Sans timeout explicite, axios attend indéfiniment (défaut: 0) — une
  // requête bloquée sur un réseau mobile/instable resterait "en cours" sans
  // jamais afficher d'erreur à l'utilisateur.
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);

export default api;
