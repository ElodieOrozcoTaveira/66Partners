import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  MessageSquareMore,
  Users,
  Bell,
  Mountain,
} from "lucide-react";
import {
  fetchStatsOverview,
  fetchTerritoryBreakdown,
  fetchUserEvolution,
  type StatsOverview,
  type TerritoryBreakdownItem,
  type TimeRange,
  type UserEvolutionPoint,
} from "../../api/adminStats";
import { useNotifications } from "../../contexts/NotificationsContext";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import StatCard from "../../components/AdminComponents/StatCard/StatCard";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import UserEvolutionChart from "../../components/AdminComponents/UserEvolutionChart/UserEvolutionChart";
import TerritoryDonutChart from "../../components/AdminComponents/TerritoryDonutChart/TerritoryDonutChart";
import "./AdminStats.scss";

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
];

type BlockState<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: T };

export default function AdminStats() {
  const { unreadCount } = useNotifications();
  const [range, setRange] = useState<TimeRange>("30d");

  const [overview, setOverview] = useState<BlockState<StatsOverview>>({ status: "loading" });
  const [evolution, setEvolution] = useState<BlockState<UserEvolutionPoint[]>>({ status: "loading" });
  const [territories, setTerritories] = useState<BlockState<TerritoryBreakdownItem[]>>({ status: "loading" });

  const loadOverview = useCallback((r: TimeRange) => {
    setOverview({ status: "loading" });
    fetchStatsOverview(r)
      .then((data) => setOverview({ status: "ready", data }))
      .catch(() => setOverview({ status: "error" }));
  }, []);

  const loadEvolution = useCallback((r: TimeRange) => {
    setEvolution({ status: "loading" });
    fetchUserEvolution(r)
      .then((data) => setEvolution({ status: "ready", data }))
      .catch(() => setEvolution({ status: "error" }));
  }, []);

  const loadTerritories = useCallback((r: TimeRange) => {
    setTerritories({ status: "loading" });
    fetchTerritoryBreakdown(r)
      .then((data) => setTerritories({ status: "ready", data }))
      .catch(() => setTerritories({ status: "error" }));
  }, []);

  useEffect(() => {
    loadOverview(range);
    loadEvolution(range);
    loadTerritories(range);
  }, [range, loadOverview, loadEvolution, loadTerritories]);

  const overviewData = overview.status === "ready" ? overview.data : null;
  const overviewLoading = overview.status === "loading";

  return (
    <div className="admin-stats-page">
      <div className="admin-stats-page__body">
        <header className="admin-stats-page__header">
          <div className="admin-stats-page__brand">
            <img src="/logo3.webp" alt="logo 66partners" />
            <span>Admin</span>
          </div>
          <span className="admin-stats-page__bell">
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="admin-stats-page__bell-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
        </header>

        <div className="admin-stats-page__greeting">
          <div>
            <h1>Bonjour Admin 👋</h1>
            <p>Voici un aperçu des statistiques de 66Partners</p>
          </div>
          <label className="admin-stats-page__range">
            <CalendarRange size={16} strokeWidth={2.2} />
            <select value={range} onChange={(e) => setRange(e.target.value as TimeRange)}>
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-stats-page__gradient-bar" />

        <section className="admin-stats-page__section">
          <h2>Vue d'ensemble</h2>
          {overview.status === "error" ? (
            <div className="admin-stats-page__grid-error">
              <ErrorBlock
                message="Impossible de charger la vue d'ensemble."
                onRetry={() => loadOverview(range)}
              />
            </div>
          ) : (
            <div className="admin-stats-page__grid">
              <StatCard
                icon={Users}
                color="#C62828"
                label="Utilisateurs"
                value={overviewData?.users.value ?? null}
                deltaPct={overviewData?.users.deltaPct}
                loading={overviewLoading}
              />
              <StatCard
                icon={CalendarDays}
                color="#F08A3C"
                label="Activités"
                value={overviewData?.activities.value ?? null}
                deltaPct={overviewData?.activities.deltaPct}
                loading={overviewLoading}
              />
              <StatCard
                icon={Users}
                color="#EDA100"
                label="Participations"
                value={overviewData?.participations.value ?? null}
                deltaPct={overviewData?.participations.deltaPct}
                loading={overviewLoading}
              />
              <StatCard
                icon={MessageSquareMore}
                color="#C62828"
                label="Messages"
                value={overviewData?.messages.value ?? null}
                deltaPct={overviewData?.messages.deltaPct}
                loading={overviewLoading}
              />
              <StatCard
                icon={Bell}
                color="#EDA100"
                label="Notifications"
                value={overviewData?.notifications.value ?? null}
                deltaPct={overviewData?.notifications.deltaPct}
                loading={overviewLoading}
              />
              <StatCard
                icon={Mountain}
                color="#7d0a18"
                label="Territoires actifs"
                value={overviewData?.territoriesActive ?? null}
                loading={overviewLoading}
              />
            </div>
          )}
        </section>

        <UserEvolutionChart
          points={evolution.status === "ready" ? evolution.data : []}
          loading={evolution.status === "loading"}
          error={evolution.status === "error"}
          onRetry={() => loadEvolution(range)}
        />

        <TerritoryDonutChart
          items={territories.status === "ready" ? territories.data : []}
          totalUsers={overviewData?.users.value ?? 0}
          loading={territories.status === "loading"}
          error={territories.status === "error"}
          onRetry={() => loadTerritories(range)}
        />
      </div>
      <AdminBottomNav />
    </div>
  );
}
