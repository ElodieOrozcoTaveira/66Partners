import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import HeroProfile from "../../components/ProfilPage/HeroProfil/HeroProfile";
import StatsProfil from "../../components/ProfilPage/StatsProfil/StatsProfil";
import TopProfile from "../../components/ProfilPage/TopProfil/TopProfil";
import "./Profil.scss";

export default function Profil() {
  return (
    <div className="profil-page">
      <HeroProfile/>
      <TopProfile/>
      <StatsProfil/>
      <BottomNavBar />
    </div>
  );
}
