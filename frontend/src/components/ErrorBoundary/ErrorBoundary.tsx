import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import "./ErrorBoundary.scss";

const RELOAD_FLAG = "66partners-chunk-reload";

/** Morceau de l'ancienne version introuvable après un déploiement. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(message);
}

interface State {
  hasError: boolean;
}

/**
 * Écran de secours si un composant plante, au lieu d'une page blanche. Après
 * un déploiement, une page restée ouverte peut réclamer un fichier de
 * l'ancienne version : on recharge alors une seule fois automatiquement.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Erreur d'affichage :", error, info.componentStack);
    if (isChunkLoadError(error)) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
        }
      } catch {
        // Stockage indisponible : l'écran de secours reste affiché.
      }
    }
  }

  componentDidMount() {
    // Rechargement réussi : on réarme pour un prochain déploiement.
    window.setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        // Rien à faire.
      }
    }, 10_000);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__card">
          <span className="error-boundary__icon" aria-hidden="true">
            <RefreshCw size={24} strokeWidth={2.4} />
          </span>
          <h1>Oups, un souci d'affichage</h1>
          <p>La page n'a pas pu s'afficher correctement. Recharge-la : tout devrait rentrer dans l'ordre.</p>
          <div className="error-boundary__actions">
            <button type="button" className="error-boundary__reload" onClick={() => window.location.reload()}>
              Recharger la page
            </button>
            <a className="error-boundary__home" href="/">
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}
