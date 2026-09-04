import { useEffect, useState } from "react";
import { CalendarDays, Flame, Trophy, Users } from "lucide-react";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import "./DashboardStats.scss";

interface Activity {
  id: string;
  startDate: string;
  status: string;
  creatorId: string;
  participantsCount: number;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

function isSameMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  );
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function DashboardStats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joinedThisMonth, setJoinedThisMonth] = useState(0);
  const [rencontresThisMonth, setRencontresThisMonth] = useState(0);
  const [organizedThisMonth, setOrganizedThisMonth] = useState(0);
  const [activeDaysThisWeek, setActiveDaysThisWeek] = useState(0);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.get<ActivitiesResponse>("/api/activities"),
      api.get<ActivitiesResponse>("/api/activities", {
        params: { participantId: user.id },
      }),
    ])
      .then(([allRes, joinedRes]) => {
        if (!mounted) return;

        const now = new Date();
        const allActivities = allRes.data.activities;
        const joined = joinedRes.data.activities.filter((a) => a.status !== "CANCELLED");
        const organized = allActivities.filter(
          (a) => a.creatorId === user.id && a.status !== "CANCELLED",
        );

        const organizedThisMonthList = organized.filter((a) =>
          isSameMonth(new Date(a.startDate), now),
        );

        setJoinedThisMonth(
          joined.filter((a) => isSameMonth(new Date(a.startDate), now)).length,
        );
        setOrganizedThisMonth(organizedThisMonthList.length);
        setRencontresThisMonth(
          organizedThisMonthList.reduce((sum, a) => sum + (Number(a.participantsCount) || 0), 0),
        );

        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        const activeDays = new Set<string>();
        [...joined, ...organized].forEach((a) => {
          const date = new Date(a.startDate);
          if (date >= weekAgo && date <= now) activeDays.add(dayKey(date));
        });
        setActiveDaysThisWeek(activeDays.size);
      })
      .catch(() => {
        if (!mounted) return;
        setJoinedThisMonth(0);
        setRencontresThisMonth(0);
        setOrganizedThisMonth(0);
        setActiveDaysThisWeek(0);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="container-dashboardstats">
      <div className="container-dashboardstats__card">
        <span
          className="container-dashboardstats__icon"
          style={{ background: "rgba(252, 2, 2, 0.21)", color: "#C62828" }}
        >
          <CalendarDays size={17} strokeWidth={2.2} />
        </span>
        <p className="container-dashboardstats__value">{loading ? "…" : joinedThisMonth}</p>
        <h4>Activités rejointes</h4>
        <span className="container-dashboardstats__sub">Ce mois</span>
      </div>

      <div className="container-dashboardstats__card">
        <span
          className="container-dashboardstats__icon"
          style={{ background: "rgba(255, 242, 0, 0.41)", color: "#f4bc08" }}
        >
          <Users size={17} strokeWidth={2.2} />
        </span>
        <p className="container-dashboardstats__value">{loading ? "…" : rencontresThisMonth}</p>
        <h4>Rencontres</h4>
        <span className="container-dashboardstats__sub">Ce mois</span>
      </div>

      <div className="container-dashboardstats__card">
        <span
          className="container-dashboardstats__icon"
          style={{ background: "rgba(255, 111, 0, 0.11)", color: "#F08A3C" }}
        >
          <Trophy size={17} strokeWidth={2.2} />
        </span>
        <p className="container-dashboardstats__value">{loading ? "…" : organizedThisMonth}</p>
        <h4>Activités organisées</h4>
        <span className="container-dashboardstats__sub">Ce mois</span>
      </div>

      <div className="container-dashboardstats__card">
        <span
          className="container-dashboardstats__icon"
          style={{ background: "rgba(76, 175, 80, 0.15)", color: "#4CAF50" }}
        >
          <Flame size={17} strokeWidth={2.2} />
        </span>
        <p className="container-dashboardstats__value">{loading ? "…" : activeDaysThisWeek}</p>
        <h4>Jours actifs</h4>
        <span className="container-dashboardstats__sub">Cette semaine</span>
      </div>
    </div>
  );
}
