import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
import { formatMonth, formatTime, formatWeekday } from "../../../lib/dateFormat";
import ModaleContent from "../../ModaleConnexion/ModaleContent/ModaleContent";
import ModaleRegisterContent from "../../ModaleRegister/ModaleRegisteContent/ModaleRegisterContent";
import "./ActivitésProche.scss";

const UPCOMING_COUNT = 4;

interface Activity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  sportId: string;
  sportName: string;
  participantsCount: number;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function ActivitésProche() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );

  useEffect(() => {
    api
      .get<ActivitiesResponse>("/api/activities")
      .then((res) => setActivities(res.data.activities))
      .catch(() => setActivities([]));
  }, []);

  useEffect(() => {
    if (activeModal && user) {
      setActiveModal(null);
      navigate("/explorer");
    }
  }, [activeModal, user, navigate]);

  function handleExplorerClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!user) {
      event.preventDefault();
      setActiveModal("login");
    }
  }

  const upcoming = useMemo(() => {
    const now = Date.now();
    return activities
      .filter(
        (activity) =>
          new Date(activity.startDate).getTime() > now &&
          activity.status !== "CANCELLED",
      )
      .slice(0, UPCOMING_COUNT);
  }, [activities]);

  return (
    <div className="container-activitesproche">
      <div className="container-activitesproche__header">
        <h2 className="container-activitesproche__h2">
          Activités près de chez vous
        </h2>
        <NavLink
          to="/explorer"
          className="container-activitesproche__btn"
          onClick={handleExplorerClick}
        >
          Voir tout
        </NavLink>
      </div>

      <div className="container-activitesproche__list">
        {upcoming.map((activity) => {
          const startDate = new Date(activity.startDate);
          const { color } = getSportVisual(activity.sportName);

          return (
            <NavLink
              key={activity.id}
              to="/explorer"
              className="activity-card"
              onClick={handleExplorerClick}
            >
              <div className="activity-card__photo-wrap">
                <img
                  src={getSportPhoto(activity.sportName)}
                  alt={activity.sportName}
                  className="activity-card__photo"
                />
                <div className="activity-card__date">
                  <span className="activity-card__date-day">
                    {formatWeekday(startDate)}
                  </span>
                  <div className="activity-card__date-body">
                    <span className="activity-card__date-number">
                      {startDate.getDate()}
                    </span>
                    <span className="activity-card__date-month">
                      {formatMonth(startDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="activity-card__body">
                <h3 className="activity-card__title">{activity.title}</h3>
                <p className="activity-card__meta">{activity.city} (66)</p>
                <p className="activity-card__meta">
                  {formatTime(startDate)} ·{" "}
                  {activity.participantsCount}/{activity.maxParticipants}{" "}
                  participants
                </p>
                <span
                  className="activity-card__sport"
                  style={{ backgroundColor: color, color: getIconColor(color) }}
                >
                  {activity.sportName}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>

      <NavLink
        to="/explorer"
        className="container-activitesproche__cta"
        onClick={handleExplorerClick}
      >
        Voir toutes les activités
      </NavLink>

      <ModaleContent
        isOpen={activeModal === "login"}
        onClose={() => setActiveModal(null)}
        onSwitchToRegister={() => setActiveModal("register")}
      />
      <ModaleRegisterContent
        isOpen={activeModal === "register"}
        onClose={() => setActiveModal(null)}
        onSwitchToLogin={() => setActiveModal("login")}
      />
    </div>
  );
}
