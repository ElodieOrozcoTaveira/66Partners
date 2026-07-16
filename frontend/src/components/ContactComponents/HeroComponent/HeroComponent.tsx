import './HeroComponent.scss';

export default function HeroComponent() {
  return (
    <div className="container-contactTitle">
      <section className="container-contactTitle__sectionLeft">
        <h2 className="container-contactTitle__h1">Contact</h2>
        <p className="container-contactTitle__p">
          Une question, une suggestion ou besoin d'aide? Notre équipe est là
          pour vous accompagner. N'hésitez pas à nous contacter, nous répondrons
          dans les plus brefs délais.
        </p>
      </section>
      <section className="container-contactTitle__sectionright">
        <img
          src="./canigou.png"
          alt="image du canigou"
          className="container-contactTitle__img"
        />
      </section>
    </div>
  );
}
