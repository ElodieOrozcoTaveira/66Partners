import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./Bonjour.scss";

type BonjourProps = {
  onNavigate?: () => void;
};

export default function Bonjour({ onNavigate }: BonjourProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    onNavigate?.();
    navigate("/profile");
  };

  return (
    <>
      <div
        className={`container-bonjour ${user ? "container-bonjour--clickable" : ""}`}
        onClick={user ? handleGoToProfile : undefined}
        role={user ? "button" : undefined}
        tabIndex={user ? 0 : undefined}
        onKeyDown={(e) => {
          if (!user) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleGoToProfile();
          }
        }}
      >
        <section className="container-bonjour__leftside">
          <img
            src={user?.avatar || "/montagne.webp"}
            alt={
              user ? `Photo de profil de ${user.pseudo}` : "logo de montagne"
            }
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
