import BottomNavBar from "../../components/BottomNavBar/BottomNavBar";
import ActivitesAutourDeToi from "../../components/DashboardComponents/ActivitesAutourDeToi/ActivitesAutourDeToi";
import Hello from "../../components/DashboardComponents/Hello/Hello";
import MesSportsCard from "../../components/DashboardComponents/MesSportsCard/MesSportsCard";
import ProchainesActivites from "../../components/DashboardComponents/ProchainesActivites/ProchainesActivites";
import ProfilCard from "../../components/DashboardComponents/ProfilCard/ProfilCard";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.scss";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__body">
        <Hello pseudo={user.pseudo} />
        <ProfilCard pseudo={user.pseudo} city={user.city} avatar={user.avatar} />
        <MesSportsCard userId={user.id} />
        <ProchainesActivites />
        <ActivitesAutourDeToi />
      </div>
      <BottomNavBar />
    </div>
  );
}
