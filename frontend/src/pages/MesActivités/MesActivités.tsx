import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import EnTete from "../../components/MesActivitesPage/EnTete/EnTete";
import ActiviteTitres, {
  type ActiviteTab,
} from "../../components/MesActivitesPage/ActiviteTitres/ActiviteTitres";
import ActiviteListing, {
  type ActiviteListItem,
} from "../../components/MesActivitesPage/ActiviteListing/ActiviteListing";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/axios";
import "./MesActivités.scss";

interface Activity extends ActiviteListItem {
  creatorId: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

const EMPTY_MESSAGES: Record<ActiviteTab, string> = {
  TOUTES: "Tu n'as pas encore d'activité. Rejoins-en une ou crée la tienne !",
  CREEES: "Tu n'as encore créé aucune activité.",
  REJOINTES: "Tu n'as encore rejoint aucune activité.",
  TERMINEES: "Aucune activité terminée pour le moment.",
};

export default function MesActivités() {
  const { user } = useAuth();
  const location = useLocation();
  const initialTab = (location.state as { tab?: ActiviteTab } | null)?.tab ?? "TOUTES";
  const [activeTab, setActiveTab] = useState<ActiviteTab>(initialTab);
  const [created, setCreated] = useState<Activity[]>([]);
  const [joined, setJoined] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setIsLoading(true);

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities"),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: user.id },
      }),
    ])
      .then(([allRes, joinedRes]) => {
        if (!mounted) return;
        const notCancelled = (activity: Activity) => activity.status !== "CANCELLED";

        setCreated(
          allRes.data.activities
            .filter(notCancelled)
            .filter((activity) => activity.creatorId === user.id),
        );
        setJoined(joinedRes.data.activities.filter(notCancelled));
      })
      .catch(() => {
        if (mounted) {
          setCreated([]);
          setJoined([]);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const all = useMemo(() => {
    const byId = new Map<string, Activity>();
    [...created, ...joined].forEach((activity) => byId.set(activity.id, activity));
    return Array.from(byId.values());
  }, [created, joined]);

  const completed = useMemo(
    () => all.filter((activity) => new Date(activity.startDate).getTime() < Date.now()),
    [all],
  );

  const activitiesByTab: Record<ActiviteTab, Activity[]> = {
    TOUTES: all,
    CREEES: created,
    REJOINTES: joined,
    TERMINEES: completed,
  };

  if (!user) return null;

  return (
    <div className="mesactivites-page">
      <div className="mesactivites-page__body">
        <EnTete />
        <ActiviteTitres active={activeTab} onChange={setActiveTab} />
        <ActiviteListing
          activities={activitiesByTab[activeTab]}
          isLoading={isLoading}
          emptyMessage={EMPTY_MESSAGES[activeTab]}
          splitByDate={activeTab !== "TERMINEES"}
        />
      </div>
    </div>
  );
}
