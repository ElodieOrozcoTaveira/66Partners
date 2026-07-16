import { useAuth } from '../../../contexts/AuthContext';
import './Bonjour.scss';

export default function Bonjour() {
  const { user } = useAuth();

  return (
    <>
      <div className="container-bonjour">
        <section className="container-bonjour__leftside">
          <img
            src={user?.avatar || "/montagne.png"}
            alt={user ? `Photo de profil de ${user.pseudo}` : "logo de montagne"}
            height={70}
            width={70}
            className="container-bonjour__img"
          />
        </section>
        <section className="container-bonjour__rightside">
          <h3 className="container-bonjour__h3">
            Bonjour {user ? user.pseudo : ""} !👋
          </h3>
          <p className="container-bonjour__p">
            Prêt pour de nouvelles aventures?{" "}
          </p>
        </section>
      </div>
    </>
  );
}
