import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ActivitiesMap } from "../../src/components/ActivitiesMap";
import { ActivityCard } from "../../src/components/ActivityCard";
import { ActivityListSkeleton } from "../../src/components/ActivityCardSkeleton";
import { SportBubble } from "../../src/components/SportBubble";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { DATE_FILTER_LABELS, matchesDateFilter, type DateFilter } from "../../src/lib/date";
import { LEVEL_LABELS } from "../../src/lib/labels";
import { getActivities } from "../../src/services/activities.service";
import { getSports } from "../../src/services/sports.service";
import type { Activity, SportLevel } from "../../src/types/domain";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import type { Brand } from "../../src/constants/brands";

const SPORTS_PREVIEW = 8;
const DATE_FILTERS = Object.keys(DATE_FILTER_LABELS) as DateFilter[];
const LEVELS = Object.keys(LEVEL_LABELS) as SportLevel[];

/** Ignore accents et casse : "randonnee" trouve "Randonnée". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ExplorerScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { activeTerritory, isLoading: territoryLoading, refreshTerritories } = useTerritory();
  const territoryCode = activeTerritory?.code;

  // Le sport choisi vit dans l'URL : l'accueil peut ouvrir cet onglet sur un sport.
  const params = useLocalSearchParams<{ sportId?: string }>();
  const sportId = params.sportId || undefined;
  const setSportId = (id: string | undefined) => router.setParams({ sportId: id ?? "" });

  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [level, setLevel] = useState<SportLevel | null>(null);
  const [carpoolOnly, setCarpoolOnly] = useState(false);
  const [showAllSports, setShowAllSports] = useState(false);
  const [view, setView] = useState<"list" | "map">("map");

  const sports = useAsync(() => getSports(), [], {
    errorMessage: "Impossible de récupérer les sports.",
  });

  // Le serveur filtre par territoire, sport et date de début ; le reste est
  // un simple filtre d'affichage sur la liste reçue (pas de pagination côté API).
  const activities = useAsync(
    async () => {
      const list = await getActivities({
        territory: territoryCode!,
        sportId,
        from: new Date().toISOString(),
      });
      return list.filter((activity) => activity.status !== "CANCELLED");
    },
    [territoryCode, sportId],
    { enabled: Boolean(territoryCode), errorMessage: "Impossible de charger les activités." }
  );

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return (activities.data ?? []).filter(
      (activity) =>
        (!needle ||
          normalize(`${activity.title} ${activity.city} ${activity.sportName}`).includes(needle)) &&
        matchesDateFilter(activity.startDate, dateFilter) &&
        (!level || activity.levelRequired === level) &&
        (!carpoolOnly || activity.carpoolEnabled)
    );
  }, [activities.data, query, dateFilter, level, carpoolOnly]);

  const openActivity = useCallback((activity: Activity) => {
    router.push({ pathname: "/activity/[id]", params: { id: activity.id } });
  }, []);

  const hasFilters = Boolean(query || sportId || level || carpoolOnly || dateFilter !== "all");
  const resetFilters = () => {
    setQuery("");
    setDateFilter("all");
    setLevel(null);
    setCarpoolOnly(false);
    setSportId(undefined);
  };

  if (territoryLoading) return <LoadingState />;
  if (!activeTerritory) {
    return (
      <ErrorState message="Impossible de déterminer ton territoire." onRetry={refreshTerritories} />
    );
  }

  const sortedSports = [...(sports.data ?? [])].sort(
    (a, b) => b.activitiesCount - a.activitiesCount
  );
  const visibleSports = showAllSports ? sortedSports : sortedSports.slice(0, SPORTS_PREVIEW);
  // Grille de 4 colonnes : on complète la dernière ligne pour garder les largeurs.
  const sportRows: (typeof visibleSports)[] = [];
  for (let i = 0; i < visibleSports.length; i += 4) sportRows.push(visibleSports.slice(i, i + 4));

  const titleRow = (
    <View style={styles.titleRow}>
      <Text style={styles.title} accessibilityRole="header">
        {view === "map" ? "Carte" : "Rechercher"}
      </Text>
      <View style={styles.toggle} accessibilityRole="tablist">
        {(["list", "map"] as const).map((mode) => (
          <Pressable
            key={mode}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === mode }}
            accessibilityLabel={mode === "list" ? "Afficher la liste" : "Afficher la carte"}
            onPress={() => setView(mode)}
            style={[styles.toggleItem, view === mode && styles.toggleItemActive]}
          >
            <Ionicons
              name={mode === "list" ? "list" : "map"}
              size={18}
              color={view === mode ? Colors.textOnPrimary : Colors.text}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );

  const searchBar = (
    <View style={styles.search}>
      <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Où veux-tu faire du sport ?"
        placeholderTextColor={Colors.textMuted}
        style={styles.searchInput}
        accessibilityLabel="Rechercher une activité, une ville ou un sport"
        returnKeyType="search"
        autoCorrect={false}
      />
      {query ? (
        <Pressable accessibilityLabel="Effacer la recherche" onPress={() => setQuery("")} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );

  if (view === "map") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.mapHeader}>
          {titleRow}
          {searchBar}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mapChipsScroll}
          contentContainerStyle={styles.mapChips}
        >
          <Chip label="Toutes" selected={!sportId} onPress={() => setSportId(undefined)} />
          {sortedSports.map((sport) => (
            <Chip
              key={sport.id}
              label={sport.name}
              selected={sport.id === sportId}
              onPress={() => setSportId(sport.id === sportId ? undefined : sport.id)}
            />
          ))}
        </ScrollView>
        {activities.isLoading ? (
          <LoadingState />
        ) : activities.error && !activities.data ? (
          <ErrorState message={activities.error} onRetry={activities.refresh} />
        ) : (
          <ActivitiesMap activities={results} onOpen={openActivity} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={activities.isRefreshing}
            onRefresh={activities.refresh}
            tintColor={brand.primary}
          />
        }
      >
        {titleRow}
        {searchBar}

        <SectionHeader
          title="Sports"
          actionLabel={sortedSports.length > SPORTS_PREVIEW ? (showAllSports ? "Réduire" : "Tout voir") : undefined}
          onAction={() => setShowAllSports((value) => !value)}
        />
        <View style={styles.grid}>
          {sportRows.map((row, index) => (
            <View key={index} style={styles.gridRow}>
              {row.map((sport) => (
                <SportBubble
                  key={sport.id}
                  shape="tile"
                  sportName={sport.name}
                  selected={sport.id === sportId}
                  onPress={() => setSportId(sport.id === sportId ? undefined : sport.id)}
                />
              ))}
              {Array.from({ length: 4 - row.length }, (_, i) => (
                <View key={`pad-${i}`} style={styles.gridPad} />
              ))}
            </View>
          ))}
        </View>

        <SectionHeader
          title="Filtres"
          actionLabel={hasFilters ? "Réinitialiser" : undefined}
          onAction={resetFilters}
        />
        <View style={styles.filters}>
          <FilterRow label="Date">
            {DATE_FILTERS.map((value) => (
              <Chip
                key={value}
                label={value === "all" ? "Toutes" : DATE_FILTER_LABELS[value]}
                selected={dateFilter === value}
                onPress={() => setDateFilter(value)}
              />
            ))}
          </FilterRow>
          <FilterRow label="Niveau">
            <Chip label="Tous niveaux" selected={!level} onPress={() => setLevel(null)} />
            {LEVELS.map((value) => (
              <Chip
                key={value}
                label={LEVEL_LABELS[value]}
                selected={level === value}
                onPress={() => setLevel(level === value ? null : value)}
              />
            ))}
          </FilterRow>
          <View style={styles.switchRow}>
            <Text style={styles.filterLabel}>Uniquement avec covoiturage</Text>
            <Switch
              value={carpoolOnly}
              onValueChange={setCarpoolOnly}
              trackColor={{ true: brand.primary, false: Colors.border }}
              thumbColor={Colors.background}
              accessibilityLabel="Uniquement avec covoiturage"
            />
          </View>
          <Text style={styles.territory}>
            <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />{" "}
            {activeTerritory.name}
          </Text>
        </View>

        <Text style={styles.resultsTitle} accessibilityRole="header" accessibilityLiveRegion="polite">
          {activities.isLoading
            ? "Résultats"
            : `${results.length} résultat${results.length > 1 ? "s" : ""}`}
        </Text>

        {activities.isLoading ? (
          <ActivityListSkeleton count={3} />
        ) : activities.error && !activities.data ? (
          <ErrorState message={activities.error} onRetry={activities.refresh} />
        ) : results.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Aucune activité ne correspond"
            message={
              hasFilters
                ? "Essaie d'élargir ta recherche ou de réinitialiser les filtres."
                : "Reviens un peu plus tard : de nouvelles sorties sont proposées régulièrement."
            }
          />
        ) : (
          <View style={styles.results}>
            {results.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} onPress={openActivity} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  toggle: {
    flexDirection: "row",
    padding: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  toggleItem: {
    width: 44,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleItemActive: {
    backgroundColor: brand.primary,
  },
  mapHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  mapChipsScroll: {
    flexGrow: 0,
  },
  mapChips: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.title,
    fontSize: 26,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheading,
    fontSize: 18,
  },
  sectionAction: {
    color: brand.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  grid: {
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  gridPad: {
    flex: 1,
  },
  filters: {
    gap: Spacing.md,
  },
  filterRow: {
    gap: Spacing.xs,
  },
  filterLabel: {
    ...Typography.label,
  },
  chips: {
    gap: Spacing.sm,
  },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipSelected: {
    backgroundColor: brand.primarySoft,
    borderColor: brand.primary,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  chipLabelSelected: {
    color: brand.primary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  territory: {
    ...Typography.caption,
  },
  resultsTitle: {
    ...Typography.subheading,
    fontSize: 18,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  results: {
    gap: Spacing.lg,
  },
});
