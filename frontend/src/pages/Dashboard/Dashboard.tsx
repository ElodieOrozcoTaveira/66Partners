import ActivitesAutourDeToi from "../../components/DashboardComponents/ActivitesAutourDeToi/ActivitesAutourDeToi";
import Hello from "../../components/DashboardComponents/Hello/Hello";
import MesSportsCard from "../../components/DashboardComponents/MesSportsCard/MesSportsCard";
import ProchainesActivites from "../../components/DashboardComponents/ProchainesActivites/ProchainesActivites";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.scss";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__body">
        <Hello pseudo={user.pseudo} avatar={user.avatar} coverPhoto={user.coverPhoto} />
        <MesSportsCard userId={user.id} />
        <ProchainesActivites />
        <ActivitesAutourDeToi />
      </div>
    </div>
  );
}
