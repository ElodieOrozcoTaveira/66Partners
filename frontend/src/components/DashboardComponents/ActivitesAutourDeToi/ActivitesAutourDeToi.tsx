import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ArrowRight, CalendarX } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import ActivityCard, { type ActivityCardData } from "../../ActivityCard/ActivityCard";
import type { Coordinates } from "../../../lib/geo";
import "./ActivitesAutourDeToi.scss";

// Les prochaines à venir (comme l'accueil de l'app mobile).
const UPCOMING_COUNT = 10;

interface Activity extends ActivityCardData {
  status: string;
  createdAt: string;
  creatorId: string | null;
}

interface ActivitesAutourDeToiProps {
  /** Toutes les activités à venir (déjà chargées par Dashboard.tsx). */
  activities: Activity[];
  /** Activités auxquelles l'utilisateur participe. */
  myActivities: Activity[];
  isLoading: boolean;
  /** Position de l'utilisateur (distance sur les cartes). */
  from?: Coordinates | null;
}

/** « À venir autour de toi » : carrousel de cartes, sans les sorties déjà miennes. */
export default function ActivitesAutourDeToi({ activities, myActivities, isLoading, from }: ActivitesAutourDeToiProps) {
  const { user } = useAuth();

  const joinedIds = useMemo(() => new Set(myActivities.map((activity) => activity.id)), [myActivities]);

  const upcoming = useMemo(() => {
    // Les miennes sont déjà en haut (« Ta prochaine sortie », Mes activités) :
    // pas de doublon ici.
    const isMine = (activity: Activity) => activity.creatorId === user?.id || joinedIds.has(activity.id);
    return activities
      .filter((activity) => activity.status !== "CANCELLED" && !isMine(activity))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, UPCOMING_COUNT);
  }, [activities, joinedIds, user]);

  return (
    <section className="dash-section" aria-labelledby="dash-autour">
      <div className="dash-section__head">
        <h2 id="dash-autour" className="dash-section__title">À venir autour de toi</h2>
        <NavLink to="/explorer" className="dash-section__link">
          Voir tout <ArrowRight size={15} />
        </NavLink>
      </div>

      {isLoading ? (
        <div className="dash-carousel" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="dash-carousel__skeleton" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="dash-empty">
          <span className="dash-empty__icon">
            <CalendarX size={24} />
          </span>
          <h3>Aucune activité à venir</h3>
          <p>Lance la première sortie de ton territoire : d'autres sportifs pourront te rejoindre.</p>
          <NavLink to="/mesactivités/nouvelle" className="btn btn--primary">
            Créer une activité
          </NavLink>
        </div>
      ) : (
        <div className="dash-carousel">
          {upcoming.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} from={from} compact />
          ))}
        </div>
      )}
    </section>
  );
}
