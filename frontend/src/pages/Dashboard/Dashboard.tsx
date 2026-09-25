import { useEffect, useState } from "react";
import ActivitesAutourDeToi from "../../components/DashboardComponents/ActivitesAutourDeToi/ActivitesAutourDeToi";
import DashboardStats from "../../components/DashboardComponents/DashboardStats/DashboardStats";
import Hello from "../../components/DashboardComponents/Hello/Hello";
import MesSportsCard from "../../components/DashboardComponents/MesSportsCard/MesSportsCard";
import ProchainesActivites from "../../components/DashboardComponents/ProchainesActivites/ProchainesActivites";
import PushNotificationsPrompt from "../../components/DashboardComponents/PushNotificationsPrompt/PushNotificationsPrompt";
import { useAuth } from "../../contexts/AuthContext";
import { useTerritory } from "../../contexts/TerritoryContext";
import api from "../../lib/axios";
import "./Dashboard.scss";

// Superset des champs consommés par DashboardStats / ProchainesActivites /
// ActivitesAutourDeToi : les trois affichaient jusqu'ici la même paire de
// requêtes ("toutes les activités" + "mes activités") chacun de leur côté
// (6 appels /api/activities redondants au montage du Dashboard). Un seul
// fetch ici, redistribué en props — chaque composant garde sa propre logique
// de filtrage/dérivation strictement inchangée.
interface DashboardActivity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  status: string;
  sportName: string;
  creatorId: string | null;
  participantsCount: number;
  maxParticipants: number;
  createdAt: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: DashboardActivity[];
}

export default function Dashboard() {
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;
  const { user } = useAuth();
  const [allActivities, setAllActivities] = useState<DashboardActivity[]>([]);
  const [myActivities, setMyActivities] = useState<DashboardActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    // territoryCode se résout de façon asynchrone au premier montage : ne
    // pas appeler avant, désormais refusé sans territoire par le backend
    // (cf. audit P-01).
    if (!user || !territoryCode) return;
    let mounted = true;
    setActivitiesLoading(true);

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities", {
        params: { territory: territoryCode },
      }),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: user.id, territory: territoryCode },
      }),
    ])
      .then(([allRes, mineRes]) => {
        if (!mounted) return;
        setAllActivities(allRes.data.activities);
        setMyActivities(mineRes.data.activities);
      })
      .catch(() => {
        if (!mounted) return;
        setAllActivities([]);
        setMyActivities([]);
      })
      .finally(() => {
        if (mounted) setActivitiesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, territoryCode]);

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <Hello pseudo={user.pseudo} avatar={user.avatar} coverPhoto={user.coverPhoto} />
      <div className="dashboard-page__body">
        <PushNotificationsPrompt />
        <DashboardStats
          activities={allActivities}
          myActivities={myActivities}
          isLoading={activitiesLoading}
        />
        <MesSportsCard userId={user.id} />
        <ProchainesActivites
          activities={allActivities}
          myActivities={myActivities}
          isLoading={activitiesLoading}
        />
        <ActivitesAutourDeToi
          activities={allActivities}
          myActivities={myActivities}
          isLoading={activitiesLoading}
        />
      </div>
    </div>
  );
}
