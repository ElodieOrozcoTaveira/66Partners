import "./ReponsePasTrouvé.scss";
import { NavLink } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ReponsePasTrouvé() {
  return (
    <div className="container-reponse">
      <div className="container-reponse__text">
        <h3 className="container-reponse__h3">Tu ne trouves pas ta réponse?</h3>
        <h4 className="container-reponse__h4">
          Notre équipe est là pour t'aider.
        </h4>
      </div>
      <NavLink to="/contact" className="container-reponse__btn">
        Nous contacter{" "}
        <ArrowRight
          className="container-avantcontact__fleche"
          size={14}
          color="#ff4550"
        />
      </NavLink>
    </div>
  );
}
