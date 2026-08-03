import "./ContactSport.scss";
import { NavLink } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ContactSport() {
  return (
    <div className="container-contactsport">
      <div className="container-contactsport__text">
        <h3 className="container-contactsport__h3">Tu ne trouves pas ton sport?</h3>
        <h4 className="container-contactsport__h4">
          Dis-nous quel sport tu pratiques et nous l'ajouterons!
        </h4>
      </div>
      <NavLink to="/contact" className="container-contactsport__btn">
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
