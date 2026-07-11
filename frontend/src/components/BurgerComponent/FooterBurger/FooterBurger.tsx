import { Copyright } from "lucide-react";
import "./FooterBurger.scss";

export default function FooterBurger() {
  return (
    <div className="container-footerburger">
      <p className="container-footerburger__copyright">
        <Copyright size={12} />
        2026 <span className="container-footerburger__span">66Partners</span>  - Tous droits réservés
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
