import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useBranding } from "../../../contexts/TerritoryContext";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { formatMonth, formatTime, formatWeekday } from "../../../lib/dateFormat";
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

  return (
    <div className="container-prochaine">
      <div className="container-prochaine__header">
        <h2 className="container-prochaine__h2">Prochaines activités</h2>
        <NavLink to="/mesactivités" className="container-prochaine__link">
          Voir tout
        </NavLink>
      </div>

      {isLoading ? (
        <p className="container-prochaine__empty">Chargement...</p>
      ) : !next ? (
        <div className="container-prochaine__empty">
          <span className="container-prochaine__emptyIcon">
            <CalendarDays size={20} strokeWidth={2.2} />
          </span>
          <p>
            Tu n'as pas d'activité à venir pour le moment.
            <br />
            Découvre des activités autour de toi ou crée la tienne !
          </p>
          <NavLink to="/mesactivités/nouvelle" className="container-prochaine__emptyCta">
            Créer une activité
          </NavLink>
        </div>
      ) : (
        <NavLink to={`/activities/${next.id}`} className="prochaine-card">
          {(() => {
            const { icon: Icon, color } = getSportVisual(next.sportName);
            const startDate = new Date(next.startDate);
            return (
              <>
                <span
                  className="prochaine-card__badge"
                  style={{ backgroundColor: color }}
                >
                  <Icon color={getIconColor(color)} size={20} />
                </span>
                <div className="prochaine-card__body">
                  <h3 className="prochaine-card__title">{next.title}</h3>
                  <p className="prochaine-card__meta">
                    {next.sportName} · {next.city}
                  </p>
                  <p className="prochaine-card__date">
                    {formatWeekday(startDate)} {startDate.getDate()}{" "}
                    {formatMonth(startDate)} · {formatTime(startDate)}
                  </p>
                  <span className="prochaine-card__creator">
                    <img
                      src={next.creatorAvatar || asset("avatarDefault")}
                      alt={next.creatorPseudo ?? "Compte supprimé"}
                      className="prochaine-card__creator-avatar"
                    />
                    {next.creatorPseudo
                      ? `Organisée par ${next.creatorPseudo}`
                      : "Organisateur du compte supprimé"}
                  </span>
                </div>
              </>
            );
          })()}
        </NavLink>
      )}
    </div>
  );
}
