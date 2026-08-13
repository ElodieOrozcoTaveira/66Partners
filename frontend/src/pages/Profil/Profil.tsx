import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import AproposProfile from "../../components/ProfilPage/A propos/Apropos";
import Dispo from "../../components/ProfilPage/Dispo/Dispo";
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
        <StatsProfil userId={user?.id ?? null} />
        <AproposProfile bio={user?.bio ?? null} />
        <Dispo dispo={user?.dispo ?? null} />
        <MesSports userId={user?.id ?? null} />
      </div>
      <BottomNavBar />
    </div>
  );
}
