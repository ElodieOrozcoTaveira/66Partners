import { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router } from "expo-router";

import {
  BarList,
  ChipRow,
  Donut,
  EvolutionChart,
  MiniStat,
  Panel,
  SectionTitle,
  StackedBar,
  StatGrid,
  TerritoryFilter,
  type BarItem,
} from "../../../src/components/admin/AdminUI";
import { Button } from "../../../src/components/ui/Button";
import { Colors, Spacing, Typography } from "../../../src/constants/theme";
import { useAdmin } from "../../../src/context/AdminContext";
import { useBrand } from "../../../src/context/BrandContext";
import { useAsync } from "../../../src/hooks/useAsync";
import {
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_STATUS_ORDER,
  ADMIN_ACTIVITY_STATUS_LABELS,
  ADMIN_PARTICIPATION_STATUS_LABELS,
  FALLBACK_COLOR,
  LEVEL_COLORS,
  LEVEL_ORDER,
  PARTICIPATION_STATUS_COLORS,
  PARTICIPATION_STATUS_ORDER,
  PROVIDER_LABELS,
  formatNumber,
  levelLabel,
  percent,
} from "../../../src/lib/adminLabels";
import { getSportVisual } from "../../../src/lib/sportVisuals";
import {
  fetchStatsInsights,
  fetchStatsOverview,
  fetchTerritoryBreakdown,
  fetchUserEvolution,
  type RankedPerson,
  type TimeRange,
} from "../../../src/services/admin.service";

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
];

export default function AdminStatsScreen() {
  const brand = useBrand();
  const { territory, territories, isAdmin } = useAdmin();
  const [range, setRange] = useState<TimeRange>("30d");
  const filter = territory || undefined;
  const brandName = territory ? territories.find((t) => t.code === territory)?.brandName : undefined;

  const overview = useAsync(() => fetchStatsOverview(range, filter), [range, filter], {
    enabled: isAdmin,
    errorMessage: "Impossible de charger la vue d'ensemble.",
  });
  const evolution = useAsync(() => fetchUserEvolution(range, filter), [range, filter], {
    enabled: isAdmin,
    errorMessage: "Impossible de charger l'évolution des inscriptions.",
  });
  const breakdown = useAsync(() => fetchTerritoryBreakdown(range), [range], {
    enabled: isAdmin,
    errorMessage: "Impossible de charger la répartition par territoire.",
  });
  const insights = useAsync(() => fetchStatsInsights(filter), [filter], {
    enabled: isAdmin,
    errorMessage: "Impossible de charger les indicateurs détaillés.",
  });

  const refreshAll = () => {
    overview.refresh();
    evolution.refresh();
    breakdown.refresh();
    insights.refresh();
  };
  const refreshing = overview.isRefreshing || evolution.isRefreshing || breakdown.isRefreshing || insights.isRefreshing;

  const o = overview.data;
  const openUser = (id: string) => router.push({ pathname: "/admin/user/[id]", params: { id } });
  const people = (list: RankedPerson[]): BarItem[] =>
    list.map((person) => ({ key: person.id, label: person.pseudo, value: person.count, onPress: () => openUser(person.id) }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={brand.primary} />}
    >
      <View>
        <Text style={styles.hello}>Bonjour Admin 👋</Text>
        <Text style={styles.caption}>
          {brandName
            ? `Voici un aperçu des statistiques de ${brandName}`
            : "Voici un aperçu des statistiques de tous les territoires"}
        </Text>
      </View>

      <TerritoryFilter />
      <ChipRow options={RANGE_OPTIONS} value={range} onChange={setRange} />

      <SectionTitle title="Vue d'ensemble" caption="Sur la période choisie, évolution par rapport à la période précédente." />
      {overview.error ? (
        <BlockError message={overview.error} onRetry={overview.refresh} />
      ) : (
        <StatGrid>
          <MiniStat icon="people" color="#C62828" label="Utilisateurs" value={o?.users.value ?? null} deltaPct={o?.users.deltaPct} onPress={() => router.push("/admin/users")} />
          <MiniStat icon="calendar" color="#F08A3C" label="Activités" value={o?.activities.value ?? null} deltaPct={o?.activities.deltaPct} onPress={() => router.push("/admin/activities")} />
          <MiniStat icon="person-add" color="#EDA100" label="Participations" value={o?.participations.value ?? null} deltaPct={o?.participations.deltaPct} onPress={() => router.push("/admin/activities")} />
          <MiniStat icon="chatbubbles" color="#C62828" label="Messages" value={o?.messages.value ?? null} deltaPct={o?.messages.deltaPct} />
          <MiniStat icon="notifications" color="#EDA100" label="Notifications" value={o?.notifications.value ?? null} deltaPct={o?.notifications.deltaPct} />
          <MiniStat icon="map" color="#7d0a18" label="Territoires actifs" value={o?.territoriesActive ?? null} />
        </StatGrid>
      )}

      <Panel title="Évolution des inscriptions" subtitle="Nombre total de comptes au fil de la période">
        {evolution.error ? (
          <BlockError message={evolution.error} onRetry={evolution.refresh} />
        ) : evolution.data ? (
          <EvolutionChart points={evolution.data} />
        ) : (
          <Loader />
        )}
      </Panel>

      <Panel title="Répartition par territoire" subtitle="Territoire principal des inscrits">
        {breakdown.error ? (
          <BlockError message={breakdown.error} onRetry={breakdown.refresh} />
        ) : breakdown.data ? (
          <Donut
            items={breakdown.data.map((item) => ({ key: item.code, label: item.name, value: item.count }))}
            total={breakdown.data.reduce((sum, item) => sum + item.count, 0)}
          />
        ) : (
          <Loader />
        )}
      </Panel>

      <SectionTitle title="Toute l'application" caption="Totaux depuis le lancement, sans limite de période." />
      {insights.error ? (
        <BlockError message={insights.error} onRetry={insights.refresh} />
      ) : !insights.data ? (
        <Loader />
      ) : (
        (() => {
          const data = insights.data;
          const { totals, engagement, activities } = data;
          return (
            <>
              <StatGrid>
                <MiniStat icon="people" label="Comptes créés" value={totals.users} />
                <MiniStat icon="calendar" label="Activités créées" value={totals.activities} />
                <MiniStat icon="person-add" label="Demandes de participation" value={totals.participations} />
                <MiniStat icon="chatbubble" label="Messages envoyés" value={totals.messages} />
                <MiniStat icon="chatbubbles" label="Discussions ouvertes" value={totals.conversations} />
                <MiniStat icon="camera" label="Photos partagées" value={totals.photos} />
                <MiniStat icon="heart" label="Sports en favori" value={totals.favorites} />
                <MiniStat icon="time" label="Créneaux de dispo" value={totals.availabilities} />
              </StatGrid>

              <Panel title="Utilisateurs" subtitle={`${formatNumber(totals.users)} comptes au total`}>
                <StatGrid>
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
                  <MiniStat icon="notifications" label="Notifs push" value={totals.pushUsers} hint="appareils abonnés" />
                </StatGrid>
                <Text style={styles.subtitle}>Mode d’inscription</Text>
                <BarList
                  showPercent
                  items={data.signupMethods.map((item) => ({
                    key: item.name,
                    label: PROVIDER_LABELS[item.name] ?? item.name,
                    value: item.count,
                  }))}
                />
              </Panel>

              <Panel title="Activités" subtitle={`${formatNumber(totals.activities)} au total`}>
                <StatGrid>
                  <MiniStat icon="calendar-clear" label="À venir" value={activities.upcoming} />
                  <MiniStat icon="checkmark-done" label="Passées" value={activities.past} />
                  <MiniStat
                    icon="pie-chart"
                    label="Remplissage moyen"
                    value={activities.fillRatePct}
                    suffix="%"
                    hint={`${activities.avgParticipants.toLocaleString("fr-FR")} participant(s) en moyenne`}
                  />
                </StatGrid>
                <Text style={styles.subtitle}>Statut</Text>
                <StackedBar
                  segments={ACTIVITY_STATUS_ORDER.map((status) => ({
                    key: status,
                    label: ADMIN_ACTIVITY_STATUS_LABELS[status] ?? status,
                    value: activities.byStatus[status] ?? 0,
                    color: ACTIVITY_STATUS_COLORS[status] ?? FALLBACK_COLOR,
                  }))}
                />
                <Text style={styles.subtitle}>Niveau demandé</Text>
                <StackedBar
                  segments={LEVEL_ORDER.map((level, i) => ({
                    key: level,
                    label: levelLabel(level),
                    value: activities.byLevel[level] ?? 0,
                    color: LEVEL_COLORS[i] ?? FALLBACK_COLOR,
                  }))}
                />
                <Text style={styles.caption}>
                  🚗 Covoiturage proposé sur {activities.carpoolEnabled} activité{activities.carpoolEnabled > 1 ? "s" : ""}
                </Text>
              </Panel>

              <Panel title="Demandes de participation" subtitle={`${formatNumber(totals.participations)} demandes, tous statuts confondus`}>
                <StackedBar
                  segments={PARTICIPATION_STATUS_ORDER.map((status) => ({
                    key: status,
                    label: ADMIN_PARTICIPATION_STATUS_LABELS[status] ?? status,
                    value: data.participationsByStatus[status] ?? 0,
                    color: PARTICIPATION_STATUS_COLORS[status] ?? FALLBACK_COLOR,
                  }))}
                />
              </Panel>

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
            </>
          );
        })()
      )}
    </ScrollView>
  );
}

function Loader() {
  const brand = useBrand();
  return <ActivityIndicator color={brand.primary} style={styles.loader} />;
}

function BlockError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <Text style={styles.caption}>{message}</Text>
      <Button label="Réessayer" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  hello: { ...Typography.title, fontSize: 24 },
  caption: { ...Typography.caption, fontSize: 14 },
  subtitle: { ...Typography.label, marginTop: Spacing.xs },
  loader: { paddingVertical: Spacing.xl },
  error: { gap: Spacing.sm, padding: Spacing.lg, borderRadius: 12, backgroundColor: Colors.background },
});
