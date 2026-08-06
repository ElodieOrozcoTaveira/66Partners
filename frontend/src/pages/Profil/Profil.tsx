import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import HeroProfile from "../../components/ProfilPage/HeroProfil/HeroProfile";
import "./Profil.scss";

export default function Profil() {
  return (
    <div className="profil-page">
      <HeroProfile/>
      <BottomNavBar />
    </div>
  );
}
