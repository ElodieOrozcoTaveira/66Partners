import "./StravaBrand.scss";

interface ConnectWithStravaProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Bouton officiel « Connect with Strava » (fichier fourni par Strava, non
 * modifié, 48 px de haut) : imposé par les règles de marque de Strava.
 */
export function ConnectWithStrava({ onClick, disabled = false }: ConnectWithStravaProps) {
  return (
    <button type="button" className="strava-connect-button" onClick={onClick} disabled={disabled}>
      <img src="/strava/btn_strava_connect_with_orange.svg" width={237} height={48} alt="Connect with Strava" />
    </button>
  );
}

/** Logo officiel « Powered by Strava ». */
export function PoweredByStrava() {
  return (
    <img
      className="powered-by-strava"
      src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg"
      width={146}
      height={15}
      alt="Powered by Strava"
    />
  );
}
