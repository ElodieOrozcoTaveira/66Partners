import "./MainLogo.scss";

/**
 * Logo principal de la plateforme (« 66 | PARTNERS » blanc, public/newLogo.webp),
 * utilisé là où aucun territoire n'est concerné (espace admin). Le logo étant
 * blanc, il est posé sur un fond chaud (dégradé orange → rouge, liseré jaune)
 * pour ressortir. `bare` : sans pastille, quand le conteneur porte déjà ce
 * fond (ex. en-tête admin). Ailleurs, chaque territoire garde son propre logo.
 */
export default function MainLogo({
  height = 40,
  className = "",
  bare = false,
}: {
  height?: number;
  className?: string;
  bare?: boolean;
}) {
  return (
    <span className={`main-logo${bare ? " main-logo--bare" : ""} ${className}`.trim()}>
      <img src="/newLogo.webp" alt="66Partners" style={{ height }} />
    </span>
  );
}
