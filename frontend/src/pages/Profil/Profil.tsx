import AproposProfile from "../../components/ProfilPage/A propos/Apropos";
import Dispo from "../../components/ProfilPage/Dispo/Dispo";
import DernieresActivites from "../../components/ProfilPage/DernieresActivites/DernieresActivites";
import HeroProfile from "../../components/ProfilPage/HeroProfil/HeroProfile";
import MesSports from "../../components/ProfilPage/MesSports/MesSports";
import StatsProfil from "../../components/ProfilPage/StatsProfil/StatsProfil";
import TopProfile from "../../components/ProfilPage/TopProfil/TopProfil";
import { useAuth } from "../../contexts/AuthContext";
import "./Profil.scss";

export default function Profil() {
  const { user } = useAuth();

  return (
    <div className="profil-page">
      <HeroProfile user={user} />
      <div className="profil-page__body">
        <TopProfile user={user} />
        <AproposProfile
          headline={user?.headline ?? null}
          lookingFor={user?.lookingFor ?? null}
          openTo={user?.openTo ?? null}
          createdAt={user?.createdAt ?? null}
        />
        <StatsProfil userId={user?.id ?? null} />
        <MesSports userId={user?.id ?? null} />
        <Dispo userId={user?.id ?? null} />
        <DernieresActivites userId={user?.id ?? null} />
      </div>
    </div>
  );
}
