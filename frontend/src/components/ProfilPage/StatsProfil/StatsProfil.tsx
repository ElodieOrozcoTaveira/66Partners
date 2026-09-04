import { useEffect, useState } from "react";
import { UserPlus, Users, Award } from "lucide-react";
import api from "../../../lib/axios";
import { getIconColor } from "../../../lib/sportVisuals";
import "./StatsProfil.scss";

interface StatsProfilProps {
  userId: string | null;
}

const JOINED_COLOR = "#C62828";
const PARTNERS_COLOR = "#F4B400";
const ORGANIZED_COLOR = "#C62828";

interface Activity {
  id: string;
  creatorId: string;
  participantsCount: number;
  status: string;
}

interface ActivitiesResponse {
  activities: Activity[];
}

export default function StatsProfil({ userId }: StatsProfilProps) {
  const [loading, setLoading] = useState(false);
  const [joinedCount, setJoinedCount] = useState<number | null>(null);
  const [partnersAccumulated, setPartnersAccumulated] = useState<number | null>(
    null,
  );
  const [organizedCount, setOrganizedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    setLoading(true);

    async function fetchStats() {
      try {
        const [allRes, joinedRes] = await Promise.all([
          api.get<ActivitiesResponse>("/api/activities"),
          api.get<ActivitiesResponse>("/api/activities", {
            params: { participantId: userId },
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
        console.error("StatsProfil: failed to fetch activities", err);
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
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="container-statprofil">
      <section className="container-statprofil__card">
        <span
          className="container-statprofil__icon"
          style={{ backgroundColor: JOINED_COLOR, color: getIconColor(JOINED_COLOR) }}
        >
          <Users size={18} strokeWidth={2.2} />
        </span>
        <p className="stat-value">{loading ? "…" : joinedCount ?? "—"}</p>
        <h4>Activités rejointes</h4>
      </section>
      <section className="container-statprofil__card">
        <span
          className="container-statprofil__icon"
          style={{
            backgroundColor: PARTNERS_COLOR,
            color: getIconColor(PARTNERS_COLOR),
          }}
        >
          <UserPlus size={18} strokeWidth={2.2} />
        </span>
        <p className="stat-value">{loading ? "…" : partnersAccumulated ?? "—"}</p>
        <h4>Rencontres</h4>
      </section>
      <section className="container-statprofil__card">
        <span
          className="container-statprofil__icon"
          style={{
            backgroundColor: ORGANIZED_COLOR,
            color: getIconColor(ORGANIZED_COLOR),
          }}
        >
          <Award size={18} strokeWidth={2.2} />
        </span>
        <p className="stat-value">{loading ? "…" : organizedCount ?? "—"}</p>
        <h4>Activités organisées</h4>
      </section>
    </div>
  );
}
