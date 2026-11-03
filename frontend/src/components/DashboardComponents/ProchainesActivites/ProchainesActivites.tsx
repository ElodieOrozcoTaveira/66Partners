import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, Compass, Flag, MapPin, Plus, Users } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useBranding } from "../../../contexts/TerritoryContext";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { formatStartsIn, formatWhen } from "../../../lib/dateFormat";
import { getSportPhoto } from "../../../lib/sportPhotos";
import "./ProchainesActivites.scss";

interface Activity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  status: string;
  sportName: string;
  creatorId: string | null;
  creatorPseudo: string | null;
  creatorAvatar: string | null;
  participantsCount?: number;
}

interface ProchainesActivitesProps {
  /** Toutes les activités (déjà chargées par Dashboard.tsx). */
  activities: Activity[];
  /** Activités auxquelles l'utilisateur participe. */
  myActivities: Activity[];
  isLoading: boolean;
}

export default function ProchainesActivites({
  activities,
  myActivities,
  isLoading,
}: ProchainesActivitesProps) {
  const { user } = useAuth();
  const { asset } = useBranding();

  const organized = useMemo(
    () => (user ? activities.filter((activity) => activity.creatorId === user.id) : []),
    [activities, user],
  );
  const joined = myActivities;

  const next = useMemo(() => {
    // `activities`/`myActivities` sont déjà filtrées à l'à-venir côté backend
    // (`from`, cf. Dashboard.tsx) : ne reste qu'à exclure les annulées et
    // trier, jamais de filtre de date en React (cf. chantier filtres de date).
    const byId = new Map<string, Activity>();
    [...organized, ...joined].forEach((activity) => byId.set(activity.id, activity));

    return Array.from(byId.values())
      .filter((activity) => activity.status !== "CANCELLED")
      .sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )[0];
  }, [organized, joined]);

  if (isLoading) {
    return <div className="next-hero next-hero--placeholder" aria-busy="true" />;
  }

  if (!next) {
    return (
      <div className="next-empty">
        <span className="next-empty__icon">
          <Flag size={22} />
        </span>
        <h2>Aucune sortie prévue</h2>
        <p>Lance une activité ou rejoins des sportifs près de chez toi.</p>
        <div className="next-empty__actions">
          <NavLink to="/mesactivités/nouvelle" className="btn btn--primary">
            <Plus size={17} /> Créer une activité
          </NavLink>
          <NavLink to="/explorer" className="btn btn--light">
            <Compass size={17} /> Explorer
          </NavLink>
        </div>
      </div>
    );
  }

  const { icon: Icon, color } = getSportVisual(next.sportName);
  const startDate = new Date(next.startDate);
  // Le créateur n'est pas compté dans participantsCount.
  const people = (next.participantsCount ?? 0) + 1;

  return (
    <NavLink
      to={`/activities/${next.id}`}
      className="next-hero"
      style={{ backgroundImage: `url(${getSportPhoto(next.sportName)})` }}
      aria-label={`Ta prochaine sortie : ${next.title}, ${formatStartsIn(startDate).toLowerCase()}`}
    >
      <div className="next-hero__shade" />
      <div className="next-hero__top">
        <span className="next-hero__countdown">
          <Clock size={14} /> {formatStartsIn(startDate)}
        </span>
        <span className="next-hero__sport" style={{ backgroundColor: color }}>
          <Icon color={getIconColor(color)} size={18} />
        </span>
      </div>
      <div className="next-hero__bottom">
        <span className="next-hero__kicker">Ta prochaine sortie</span>
        <h2 className="next-hero__title">{next.title}</h2>
        <div className="next-hero__meta">
          <span><CalendarDays size={15} /> {formatWhen(startDate)}</span>
          <span><MapPin size={15} /> {next.city}</span>
          <span><Users size={15} /> {people} sportif{people > 1 ? "s" : ""}</span>
        </div>
        <span className="next-hero__creator">
          <img src={next.creatorAvatar || asset("avatarDefault")} alt="" />
          {next.creatorPseudo ? `Organisée par ${next.creatorPseudo}` : "Organisateur du compte supprimé"}
        </span>
      </div>
      <span className="next-hero__go">
        <ArrowRight size={20} />
      </span>
    </NavLink>
  );
}
