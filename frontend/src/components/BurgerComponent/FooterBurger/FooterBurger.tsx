import { Copyright } from "lucide-react";
import "./FooterBurger.scss";
import { useBranding } from "../../../contexts/TerritoryContext";

export default function FooterBurger() {
  const { brandName } = useBranding();
  return (
    <div className="container-footerburger">
      <p className="container-footerburger__copyright">
        <Copyright size={12} />
        2026 <span className="container-footerburger__span">{brandName}</span>  - Tous droits réservés
      </p>
      <ul className="container-footerburger__docs">
        <li>
          <a href="/MentionsLegales">Mentions Légales</a>
        </li>
        <li>
          <a href="/CGU">CGU</a>
        </li>
        <li>
          <a href="/confidentialité">Confidentialité</a>
        </li>
      </ul>
    </div>
  );
}
