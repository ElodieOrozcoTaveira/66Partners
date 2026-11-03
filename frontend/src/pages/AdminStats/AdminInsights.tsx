import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellRing,
  CalendarCheck,
  CalendarClock,
  Camera,
  Car,
  Clock,
  Heart,
  MessageCircle,
  MessagesSquare,
  Percent,
  UserCheck,
  Users,
} from "lucide-react";
import { fetchStatsInsights, type RankedPerson, type StatsInsights } from "../../api/adminStats";
import { MiniStat, Panel, StackedBar } from "../../components/AdminComponents/AdminPanel/AdminPanel";
import BarList from "../../components/AdminComponents/BarList/BarList";
import ErrorBlock from "../../components/AdminComponents/ErrorBlock/ErrorBlock";
import Skeleton from "../../components/AdminComponents/Skeleton/Skeleton";
import {
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_ORDER,
  LEVEL_ORDER,
  PARTICIPATION_STATUS_COLORS,
  PARTICIPATION_STATUS_LABELS,
  PARTICIPATION_STATUS_ORDER,
  PROVIDER_LABELS,
  levelLabel,
  percent,
} from "../../lib/adminLabels";
import { getSportVisual } from "../../lib/sportVisuals";
import "../../components/AdminComponents/AdminPanel/AdminPanel.scss";

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: StatsInsights };

const LEVEL_COLORS = ["#86efac", "#22c55e", "#f59e0b", "#c62828"];

/**
 * Vue "depuis le lancement" : totaux, répartitions et classements de toute
 * l'application (ou du territoire filtré), indépendamment de la période.
 */
export default function AdminInsights({ territory }: { territory?: string }) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchStatsInsights(territory)
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }, [territory]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "error") {
    return (
      <section className="admin-stats-page__section">
        <h2>Toute l'application</h2>
        <div className="admin-panel">
          <ErrorBlock message="Impossible de charger les indicateurs détaillés." onRetry={load} />
        </div>
      </section>
    );
  }

  if (state.status === "loading") {
    return (
      <section className="admin-stats-page__section">
        <h2>Toute l'application</h2>
        <div className="admin-page__grid admin-page__grid--4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="admin-mini-stat">
              <Skeleton width="50%" height="1.3rem" />
              <Skeleton width="75%" height="0.7rem" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const data = state.data;
  const { totals, engagement, activities } = data;
  const openUser = (id: string) => navigate(`/admin/utilisateurs/${id}`);
  const people = (list: RankedPerson[]) =>
    list.map((person) => ({
      key: person.id,
      label: person.pseudo,
      value: person.count,
      onClick: () => openUser(person.id),
    }));

  return (
    <>
      <section className="admin-stats-page__section">
        <h2>Toute l'application</h2>
        <p className="admin-insights__intro">Totaux depuis le lancement, sans limite de période.</p>
        <div className="admin-page__grid admin-page__grid--4">
          <MiniStat icon={Users} label="Comptes créés" value={totals.users} />
          <MiniStat icon={CalendarCheck} label="Activités créées" value={totals.activities} />
          <MiniStat icon={UserCheck} label="Demandes de participation" value={totals.participations} />
          <MiniStat icon={MessageCircle} label="Messages envoyés" value={totals.messages} />
          <MiniStat icon={MessagesSquare} label="Discussions ouvertes" value={totals.conversations} />
          <MiniStat icon={Camera} label="Photos partagées" value={totals.photos} />
          <MiniStat icon={Heart} label="Sports en favori" value={totals.favorites} />
          <MiniStat icon={Clock} label="Créneaux de dispo" value={totals.availabilities} />
        </div>
      </section>

      <div className="admin-page__two-cols">
        <Panel title="Utilisateurs" subtitle={`${totals.users} comptes au total`}>
          <div className="admin-page__grid">
            <MiniStat
              label="Actifs"
              value={percent(engagement.activeUsers, totals.users)}
              suffix="%"
              hint={`${engagement.activeUsers} ont créé ou rejoint une activité`}
            />
            <MiniStat
              label="Avec photo"
              value={percent(engagement.usersWithAvatar, totals.users)}
              suffix="%"
              hint={`${engagement.usersWithAvatar} profils`}
            />
            <MiniStat
              icon={BellRing}
              label="Notifs push"
              value={totals.pushUsers}
              hint="appareils abonnés"
            />
          </div>
          <h4 className="admin-insights__subtitle">Mode d'inscription</h4>
          <BarList
            showPercent
            items={data.signupMethods.map((item) => ({
              key: item.name,
              label: PROVIDER_LABELS[item.name] ?? item.name,
              value: item.count,
            }))}
          />
        </Panel>

        <Panel title="Activités" subtitle={`${totals.activities} au total`}>
          <div className="admin-page__grid">
            <MiniStat icon={CalendarClock} label="À venir" value={activities.upcoming} />
            <MiniStat icon={CalendarCheck} label="Passées" value={activities.past} />
            <MiniStat
              icon={Percent}
              label="Remplissage moyen"
              value={activities.fillRatePct}
              suffix="%"
              hint={`${activities.avgParticipants.toLocaleString("fr-FR")} participant(s) en moyenne`}
            />
          </div>
          <h4 className="admin-insights__subtitle">Statut</h4>
          <StackedBar
            segments={ACTIVITY_STATUS_ORDER.map((status) => ({
              key: status,
              label: ACTIVITY_STATUS_LABELS[status] ?? status,
              value: activities.byStatus[status] ?? 0,
              color: ACTIVITY_STATUS_COLORS[status] ?? "#94a3b8",
            }))}
          />
          <h4 className="admin-insights__subtitle">Niveau demandé</h4>
          <StackedBar
            segments={LEVEL_ORDER.map((level, i) => ({
              key: level,
              label: levelLabel(level),
              value: activities.byLevel[level] ?? 0,
              color: LEVEL_COLORS[i] ?? "#94a3b8",
            }))}
          />
          <p className="admin-insights__note">
            <Car size={14} strokeWidth={2.2} /> Covoiturage proposé sur {activities.carpoolEnabled} activité
            {activities.carpoolEnabled > 1 ? "s" : ""}
          </p>
        </Panel>
      </div>

      <Panel
        title="Demandes de participation"
        subtitle={`${totals.participations} demandes, tous statuts confondus`}
      >
        <StackedBar
          segments={PARTICIPATION_STATUS_ORDER.map((status) => ({
            key: status,
            label: PARTICIPATION_STATUS_LABELS[status] ?? status,
            value: data.participationsByStatus[status] ?? 0,
            color: PARTICIPATION_STATUS_COLORS[status] ?? "#94a3b8",
          }))}
        />
      </Panel>

      <div className="admin-page__two-cols">
        <Panel title="Sports les plus pratiqués" subtitle="Nombre d'activités créées">
          <BarList
            items={data.topSports.map((item) => ({
              key: item.name,
              label: item.name,
              value: item.count,
              color: getSportVisual(item.name).color,
            }))}
          />
        </Panel>
        <Panel title="Sports favoris" subtitle="Ajoutés en favori par les membres">
          <BarList
            items={data.favoriteSports.map((item) => ({
              key: item.name,
              label: item.name,
              value: item.count,
              color: getSportVisual(item.name).color,
            }))}
          />
        </Panel>
        <Panel title="Villes des activités">
          <BarList items={data.activityCities.map((item) => ({ key: item.name, label: item.name, value: item.count }))} />
        </Panel>
        <Panel title="Villes des membres" subtitle="Ville renseignée sur le profil">
          <BarList items={data.userCities.map((item) => ({ key: item.name, label: item.name, value: item.count }))} />
        </Panel>
        <Panel title="Organisateurs les plus actifs" subtitle="Activités créées">
          <BarList items={people(data.topOrganizers)} />
        </Panel>
        <Panel title="Participants les plus actifs" subtitle="Participations acceptées">
          <BarList items={people(data.topParticipants)} />
        </Panel>
      </div>
    </>
  );
}
