import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { MapPin, Navigation, Users } from "lucide-react";
import ActivitesAutourDeToi from "../../components/DashboardComponents/ActivitesAutourDeToi/ActivitesAutourDeToi";
import DashboardStats from "../../components/DashboardComponents/DashboardStats/DashboardStats";
import Hello from "../../components/DashboardComponents/Hello/Hello";
import MesSportsCard from "../../components/DashboardComponents/MesSportsCard/MesSportsCard";
import ProchainesActivites from "../../components/DashboardComponents/ProchainesActivites/ProchainesActivites";
import PushNotificationsPrompt from "../../components/DashboardComponents/PushNotificationsPrompt/PushNotificationsPrompt";
import { useAuth } from "../../contexts/AuthContext";
import { useBranding, useTerritory } from "../../contexts/TerritoryContext";
import { useUserLocation } from "../../hooks/useUserLocation";
import { useNearbyCount } from "../../hooks/useNearbyCount";
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
  creatorPseudo: string | null;
  creatorAvatar: string | null;
  participantsCount: number;
  maxParticipants: number;
  createdAt: string;
  sportId?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface ActivitiesResponse {
  success: boolean;
  activities: DashboardActivity[];
}

export default function Dashboard() {
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;
  const { user } = useAuth();
  const { territoryName } = useBranding();
  // Position : seulement si déjà autorisée, ou au clic sur la pastille
  // (jamais de demande d'autorisation à l'ouverture, comme l'app mobile).
  const location = useUserLocation();
  const nearby = useNearbyCount(location.coords);
  // DashboardStats a besoin de l'historique complet (ex. "ce mois-ci" compte
  // aussi les activités déjà passées) : jamais filtré par date.
  const [allActivities, setAllActivities] = useState<DashboardActivity[]>([]);
  const [myActivities, setMyActivities] = useState<DashboardActivity[]>([]);
  // ProchainesActivites / ActivitesAutourDeToi, eux, ne doivent montrer que
  // l'à-venir — filtré côté backend (`from`), jamais récupéré en entier puis
  // masqué en React (cf. chantier filtres de date).
  const [upcomingActivities, setUpcomingActivities] = useState<DashboardActivity[]>([]);
  const [upcomingMyActivities, setUpcomingMyActivities] = useState<DashboardActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    // territoryCode se résout de façon asynchrone au premier montage : ne
    // pas appeler avant, désormais refusé sans territoire par le backend
    // (cf. audit P-01).
    if (!user || !territoryCode) return;
    let mounted = true;
    setActivitiesLoading(true);
    const from = new Date().toISOString();

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities", {
        params: { territory: territoryCode },
      }),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: user.id, territory: territoryCode },
      }),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { territory: territoryCode, from },
      }),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: user.id, territory: territoryCode, from },
      }),
    ])
      .then(([allRes, mineRes, upcomingRes, upcomingMineRes]) => {
        if (!mounted) return;
        setAllActivities(allRes.data.activities);
        setMyActivities(mineRes.data.activities);
        setUpcomingActivities(upcomingRes.data.activities);
        setUpcomingMyActivities(upcomingMineRes.data.activities);
      })
      .catch(() => {
        if (!mounted) return;
        setAllActivities([]);
        setMyActivities([]);
        setUpcomingActivities([]);
        setUpcomingMyActivities([]);
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
      <Hello pseudo={user.pseudo} avatar={user.avatar} coverPhoto={user.coverPhoto}>
        {territoryName ? (
          <span className="hello-chip hello-chip--static">
            <MapPin size={14} /> {territoryName}
          </span>
        ) : null}
        {nearby ? (
          <NavLink to="/explorer" className="hello-chip">
            <Users size={14} /> {nearby.count} sportif{nearby.count > 1 ? "s" : ""} autour de toi
          </NavLink>
        ) : location.status === "idle" || location.status === "granted" ? (
          <button type="button" className="hello-chip" onClick={() => void location.locate()}>
            <Navigation size={14} /> Voir les sportifs autour de moi
          </button>
        ) : location.status === "locating" ? (
          <span className="hello-chip hello-chip--static">
            <Navigation size={14} /> Localisation…
          </span>
        ) : null}
      </Hello>
      <div className="dashboard-page__body">
        <div className="dashboard-page__hero">
          <ProchainesActivites
            activities={upcomingActivities}
            myActivities={upcomingMyActivities}
            isLoading={activitiesLoading}
          />
        </div>
        <PushNotificationsPrompt />
        <DashboardStats
          activities={allActivities}
          myActivities={myActivities}
          isLoading={activitiesLoading}
        />
        <ActivitesAutourDeToi
          activities={upcomingActivities}
          myActivities={upcomingMyActivities}
          isLoading={activitiesLoading}
          from={location.coords}
        />
        <MesSportsCard userId={user.id} upcomingActivities={upcomingActivities} />
      </div>
    </div>
  );
}
