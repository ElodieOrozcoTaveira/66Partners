import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AdminSearch, ListSummary } from "../../../src/components/admin/AdminList";
import { ChipRow, StatusBadge, TerritoryFilter } from "../../../src/components/admin/AdminUI";
import { SportIcon } from "../../../src/components/SportIcon";
import { EmptyState, ErrorState, LoadingState } from "../../../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../../../src/constants/theme";
import { useAdmin } from "../../../src/context/AdminContext";
import { useBrand } from "../../../src/context/BrandContext";
import { useAsync } from "../../../src/hooks/useAsync";
import {
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_STATUS_ORDER,
  ADMIN_ACTIVITY_STATUS_LABELS,
  FALLBACK_COLOR,
  formatDateTime,
  levelLabel,
  normalizeSearch,
} from "../../../src/lib/adminLabels";
import { fetchAdminActivities, type AdminActivityListItem } from "../../../src/services/admin.service";

type TimeFilter = "all" | "upcoming" | "past";

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passées" },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous statuts" },
  ...ACTIVITY_STATUS_ORDER.map((status) => ({ value: status, label: ADMIN_ACTIVITY_STATUS_LABELS[status] })),
];

export default function AdminActivitiesScreen() {
  const brand = useBrand();
  const { territory, isAdmin } = useAdmin();
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState("");

  // "À venir" / "Passées" : par rapport à l'heure du chargement de la liste.
  const loaded = useAsync(
    async () => ({ list: await fetchAdminActivities(territory || undefined), loadedAt: Date.now() }),
    [territory],
    { enabled: isAdmin, errorMessage: "Impossible de charger les activités." }
  );
  const activities = { ...loaded, data: loaded.data?.list };

  const visible = useMemo(() => {
    const needle = normalizeSearch(query.trim());
    const now = loaded.data?.loadedAt ?? 0;
    return (loaded.data?.list ?? []).filter((activity) => {
      if (statusFilter && activity.status !== statusFilter) return false;
      const start = new Date(activity.startDate).getTime();
      if (timeFilter === "upcoming" && start < now) return false;
      if (timeFilter === "past" && start >= now) return false;
      if (!needle) return true;
      return normalizeSearch(
        `${activity.title} ${activity.sportName} ${activity.city} ${activity.creatorPseudo ?? ""}`
      ).includes(needle);
    });
  }, [loaded.data, query, timeFilter, statusFilter]);

  const total = activities.data?.length ?? 0;
  const isFiltered = Boolean(query || statusFilter || timeFilter !== "all");

  const header = (
    <View style={styles.header}>
      <TerritoryFilter />
      <AdminSearch value={query} onChange={setQuery} placeholder="Titre, sport, ville ou organisateur" />
      <ChipRow options={TIME_FILTERS} value={timeFilter} onChange={setTimeFilter} />
      <ChipRow options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      {activities.data ? (
        <ListSummary
          text={`${total} activité${total > 1 ? "s" : ""} créée${total > 1 ? "s" : ""}${
            isFiltered ? ` · ${visible.length} affichée${visible.length > 1 ? "s" : ""}` : ""
          }`}
        />
      ) : null}
    </View>
  );

  if (activities.isLoading) return <LoadingState />;
  if (!activities.data) {
    return <ErrorState message={activities.error ?? "Erreur de chargement."} onRetry={activities.refresh} />;
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(activity) => activity.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl refreshing={activities.isRefreshing} onRefresh={activities.refresh} tintColor={brand.primary} />
      }
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title={isFiltered ? "Aucun résultat" : "Aucune activité"}
          message={isFiltered ? "Aucune activité ne correspond à ces filtres." : "Aucune activité créée pour l'instant."}
        />
      }
      renderItem={({ item }) => <ActivityRow activity={item} />}
    />
  );
}

function ActivityRow({ activity }: { activity: AdminActivityListItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fiche de l'activité ${activity.title}`}
      onPress={() => router.push({ pathname: "/admin/activity/[id]", params: { id: activity.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <SportIcon sportName={activity.sportName} size={40} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {activity.sportName} · {activity.city} · {activity.territoryCode}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatDateTime(activity.startDate)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Par {activity.creatorPseudo ?? "compte supprimé"} · {levelLabel(activity.levelRequired)}
        </Text>
        <View style={styles.footer}>
          <StatusBadge
            label={ADMIN_ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
            color={ACTIVITY_STATUS_COLORS[activity.status] ?? FALLBACK_COLOR}
          />
          <Text style={styles.places}>
            {activity.participantsCount}/{activity.maxParticipants} places
            {activity.pendingCount ? ` · ${activity.pendingCount} en attente` : ""}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  header: { gap: Spacing.md, marginBottom: Spacing.sm },
  pressed: { opacity: 0.7 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowText: { flex: 1, gap: 2 },
  title: { ...Typography.subheading, fontSize: 15 },
  meta: { ...Typography.caption, fontSize: 12, lineHeight: 16 },
  footer: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: Spacing.sm, marginTop: 4 },
  places: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
});
