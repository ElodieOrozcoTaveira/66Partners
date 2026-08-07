import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import api from "../../../lib/axios";
import "./StatsProfil.scss";

export default function StatsProfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [totalActivities, setTotalActivities] = useState<number | null>(null);
  const [partnersAccumulated, setPartnersAccumulated] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    let mounted = true;
    setLoading(true);

    async function fetchStats() {
      try {
        const res = await api.get<{ activities: any[] }>("/api/activities");
        if (!mounted) return;
        const activities = res.data.activities || [];

        const myActivities = activities.filter((a) => a.creatorId === userId);
        const total = myActivities.length;
        const partners = myActivities.reduce(
          (sum, a) => sum + (Number(a.participantsCount) || 0),
          0,
        );

        setTotalActivities(total);
        setPartnersAccumulated(partners);
      } catch (err) {
        console.error("StatsProfil: failed to fetch activities", err);
        setTotalActivities(0);
        setPartnersAccumulated(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="container-statprofil">
      <section className="container-statprofil__activity">
        {loading ? (
            <p>Chargement...</p>
        ) : (
            <p className="stat-value">{totalActivities ?? "—"}</p>
        )}
        <h4>Activités</h4>
      </section>
      <section className="container-statprofil__partenaires">
        {loading ? (
            <p>Chargement...</p>
        ) : (
            <p className="stat-value">{partnersAccumulated ?? "—"}</p>
        )}
        <h4>Sportifs</h4>
      </section>
    </div>
  );
}
