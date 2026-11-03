import { useEffect, useState } from "react";
import { CalendarDays, Flame, Trophy, Users } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import "./DashboardStats.scss";

interface Activity {
  id: string;
  startDate: string;
  status: string;
  creatorId: string | null;
  participantsCount: number;
}

interface DashboardStatsProps {
  /** Toutes les activités (déjà chargées par Dashboard.tsx). */
  activities: Activity[];
  /** Activités auxquelles l'utilisateur participe. */
  myActivities: Activity[];
  isLoading: boolean;
}

function isSameMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  );
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function DashboardStats({
  activities,
  myActivities,
  isLoading: loading,
}: DashboardStatsProps) {
  const { user } = useAuth();
  const [joinedThisMonth, setJoinedThisMonth] = useState(0);
  const [rencontresThisMonth, setRencontresThisMonth] = useState(0);
  const [organizedThisMonth, setOrganizedThisMonth] = useState(0);
  const [activeDaysThisWeek, setActiveDaysThisWeek] = useState(0);

  useEffect(() => {
    if (!user || loading) return;

    const now = new Date();
    const joined = myActivities.filter((a) => a.status !== "CANCELLED");
    const organized = activities.filter(
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
  }, [user, activities, myActivities, loading]);

  if (!user) return null;

  return (
    <div className="container-dashboardstats">
      <div className="container-dashboardstats__card">
        <span
          className="container-dashboardstats__icon"
          style={{ background: "color-mix(in srgb, var(--brand-primary, #C4121A) 12%, transparent)", color: "var(--brand-primary, #C4121A)" }}
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
          style={{ background: "color-mix(in srgb, var(--brand-accent, #FFCC00) 30%, transparent)", color: "#8a6100" }}
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
          style={{ background: "#eef2ff", color: "#4f46e5" }}
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
          style={{ background: "#e8f5e9", color: "#2e7d32" }}
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
