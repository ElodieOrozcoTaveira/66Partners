import { ArrowRight } from "lucide-react";
import "./AvantContact.scss";
import { NavLink } from "react-router-dom";

export default function AvantContact() {
  return (
    <>
      <div className="container-avantcontact">
        <h2 className="container-avantcontact__h2">Avant de nous contacter</h2>
        <p className="container-avantcontact__p">
          Consultez notre FAQ, vous y trouverez peut-être des réponses à vos
          questions.
        </p>
        <section className="container-avantcontact__button">
          <NavLink to="/FAQ" className="container-avantcontact__btnfaq">
            <a className="container-avantcontact__btnfaq">
              Voir la FAQ{" "}
              <ArrowRight
                className="container-avantcontact__fleche"
                size={14}
                color="#C62828"
              />
            </a>
          </NavLink>
        </section>
      </div>
    </>
  );
}
