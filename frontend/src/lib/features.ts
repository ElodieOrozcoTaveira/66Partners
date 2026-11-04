/**
 * Fonctionnalités en cours de développement, visibles uniquement en local
 * (`vite` en mode dev). `import.meta.env.DEV` vaut false dans tout build de
 * production : le code correspondant est alors retiré du bundle.
 */
export const STRAVA_ENABLED = import.meta.env.DEV;
