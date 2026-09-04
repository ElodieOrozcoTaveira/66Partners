import ActivitesAutourDeToi from "../../components/DashboardComponents/ActivitesAutourDeToi/ActivitesAutourDeToi";
import DashboardStats from "../../components/DashboardComponents/DashboardStats/DashboardStats";
import Hello from "../../components/DashboardComponents/Hello/Hello";
import MesSportsCard from "../../components/DashboardComponents/MesSportsCard/MesSportsCard";
import ProchainesActivites from "../../components/DashboardComponents/ProchainesActivites/ProchainesActivites";
import PushNotificationsPrompt from "../../components/DashboardComponents/PushNotificationsPrompt/PushNotificationsPrompt";
import { useAuth } from "../../contexts/AuthContext";
import "./Dashboard.scss";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <Hello pseudo={user.pseudo} avatar={user.avatar} coverPhoto={user.coverPhoto} />
      <div className="dashboard-page__body">
        <PushNotificationsPrompt />
        <DashboardStats />
        <MesSportsCard userId={user.id} />
        <ProchainesActivites />
        <ActivitesAutourDeToi />
      </div>
    </div>
  );
}
