/**
 * Strava : toujours visible en local ; en production seulement si le build
 * reçoit VITE_STRAVA_ENABLED=true (cf. docker-compose.prod.yml). Sinon le code
 * correspondant est retiré du bundle.
 */
export const STRAVA_ENABLED = import.meta.env.DEV || import.meta.env.VITE_STRAVA_ENABLED === "true";
