import { useEffect, useState, type ReactNode } from "react";
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
  // Les 7 derniers jours (du plus ancien à aujourd'hui) : actif ou non.
  const [weekDays, setWeekDays] = useState<{ label: string; active: boolean }[]>([]);

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
    const formatter = new Intl.DateTimeFormat("fr-FR", { weekday: "narrow" });
    setWeekDays(
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekAgo);
        day.setDate(weekAgo.getDate() + index);
        return { label: formatter.format(day).toUpperCase(), active: activeDays.has(dayKey(day)) };
      }),
    );
  }, [user, activities, myActivities, loading]);

  if (!user) return null;

  const value = (n: number) => (loading ? "…" : n);
  const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date());

  return (
    <section className="dash-stats" aria-label="Mon activité">
      <StatCard
        tone="brand"
        icon={<CalendarDays size={20} strokeWidth={2.2} />}
        value={value(joinedThisMonth)}
        label={joinedThisMonth > 1 ? "Activités rejointes" : "Activité rejointe"}
        sub={`En ${monthName}`}
      />
      <StatCard
        tone="accent"
        icon={<Users size={20} strokeWidth={2.2} />}
        value={value(rencontresThisMonth)}
        label={rencontresThisMonth > 1 ? "Rencontres" : "Rencontre"}
        sub="Sportifs à tes sorties"
      />
      <StatCard
        tone="violet"
        icon={<Trophy size={20} strokeWidth={2.2} />}
        value={value(organizedThisMonth)}
        label={organizedThisMonth > 1 ? "Activités organisées" : "Activité organisée"}
        sub={`En ${monthName}`}
      />
      <StatCard
        tone="green"
        icon={<Flame size={20} strokeWidth={2.2} />}
        value={value(activeDaysThisWeek)}
        label={activeDaysThisWeek > 1 ? "Jours actifs" : "Jour actif"}
        sub="Sur 7 jours"
      >
        <div className="dash-stats__week" aria-hidden="true">
          {weekDays.map((day, index) => (
            <span key={index} className={day.active ? "is-active" : undefined}>
              {day.label}
            </span>
          ))}
        </div>
      </StatCard>
    </section>
  );
}

/** Carte de statistique (tableau de bord, profil). */
export function StatCard({
  tone,
  icon,
  value,
  label,
  sub,
  children,
}: {
  tone: "brand" | "accent" | "violet" | "green";
  icon: ReactNode;
  value: ReactNode;
  label: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`dash-stats__card dash-stats__card--${tone}`}
      aria-label={`${value} ${label}, ${sub.toLowerCase()}`}
    >
      <span className="dash-stats__watermark" aria-hidden="true">
        {icon}
      </span>
      <span className="dash-stats__icon">{icon}</span>
      <span className="dash-stats__value">{value}</span>
      <span className="dash-stats__label">{label}</span>
      <span className="dash-stats__sub">{sub}</span>
      {children}
    </div>
  );
}
