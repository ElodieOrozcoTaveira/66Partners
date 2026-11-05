import { useEffect, useState } from "react";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { useTerritory } from "../../../contexts/TerritoryContext";
import api from "../../../lib/axios";
import { StatCard } from "../../DashboardComponents/DashboardStats/DashboardStats";
import "../../DashboardComponents/DashboardStats/DashboardStats.scss";
import "./StatsProfil.scss";

interface StatsProfilProps {
  userId: string | null;
}

interface Activity {
  id: string;
  creatorId: string | null;
  participantsCount: number;
  status: string;
}

interface ActivitiesResponse {
  activities: Activity[];
}

export default function StatsProfil({ userId }: StatsProfilProps) {
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;
  const [loading, setLoading] = useState(false);
  const [joinedCount, setJoinedCount] = useState<number | null>(null);
  const [partnersAccumulated, setPartnersAccumulated] = useState<number | null>(
    null,
  );
  const [organizedCount, setOrganizedCount] = useState<number | null>(null);

  useEffect(() => {
    // territoryCode se résout de façon asynchrone au premier montage : ne
    // pas appeler avant, désormais refusé sans territoire par le backend
    // (cf. audit P-01).
    if (!userId || !territoryCode) return;

    let mounted = true;
    setLoading(true);

    async function fetchStats() {
      try {
        const [allRes, joinedRes] = await Promise.all([
          api.get<ActivitiesResponse>("/api/activities", {
        params: { territory: territoryCode },
      }),
          api.get<ActivitiesResponse>("/api/activities", {
            params: { participantId: userId, territory: territoryCode },
          }),
        ]);
        if (!mounted) return;

        const activities = allRes.data.activities || [];
        const myActivities = activities.filter((a) => a.creatorId === userId);
        const partners = myActivities.reduce(
          (sum, a) => sum + (Number(a.participantsCount) || 0),
          0,
        );

        setOrganizedCount(myActivities.length);
        setPartnersAccumulated(partners);
        setJoinedCount(
          joinedRes.data.activities.filter((a) => a.status !== "CANCELLED").length,
        );
      } catch (err) {
        console.error(
          "StatsProfil: failed to fetch activities",
          err instanceof Error ? err.message : "Erreur inconnue",
        );
        setOrganizedCount(0);
        setPartnersAccumulated(0);
        setJoinedCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [userId, territoryCode]);

  if (!userId) return null;

  const value = (n: number | null) => (loading ? "…" : n ?? "—");
  const plural = (n: number | null) => (n ?? 0) > 1;

  return (
    <section className="dash-stats dash-stats--trio container-statprofil" aria-label="Statistiques">
      <StatCard
        tone="brand"
        icon={<CalendarDays size={20} strokeWidth={2.2} />}
        value={value(joinedCount)}
        label={plural(joinedCount) ? "Activités rejointes" : "Activité rejointe"}
        sub="Au total"
      />
      <StatCard
        tone="accent"
        icon={<Users size={20} strokeWidth={2.2} />}
        value={value(partnersAccumulated)}
        label={plural(partnersAccumulated) ? "Rencontres" : "Rencontre"}
        sub="Sportifs réunis"
      />
      <StatCard
        tone="violet"
        icon={<Trophy size={20} strokeWidth={2.2} />}
        value={value(organizedCount)}
        label={plural(organizedCount) ? "Activités organisées" : "Activité organisée"}
        sub="Au total"
      />
    </section>
  );
}
