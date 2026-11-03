import { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";

import { ActivityCard } from "../../src/components/ActivityCard";
import { FadeIn } from "../../src/components/ui/FadeIn";
import { ActivityListSkeleton } from "../../src/components/ActivityCardSkeleton";
import { EmptyState, ErrorState } from "../../src/components/ui/StateViews";
import { Colors, Spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand } from "../../src/context/BrandContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { getMyActivities, type MyActivitiesKind } from "../../src/services/profileStats";
import type { Activity } from "../../src/types/domain";

const COPY: Record<MyActivitiesKind, { title: string; empty: string; message: string }> = {
  participations: {
    title: "Mes participations",
    empty: "Aucune participation pour l'instant",
    message: "Les activités où ta demande a été acceptée apparaîtront ici.",
  },
  created: {
    title: "Mes activités créées",
    empty: "Tu n'as encore créé aucune activité",
    message: "Les activités que tu organises apparaîtront ici.",
  },
};

/** Liste "Mes participations" ou "Mes activités créées" (depuis le profil). */
export default function MyActivitiesScreen() {
  const brand = useBrand();
  const { kind: rawKind } = useLocalSearchParams<{ kind?: string }>();
  const kind: MyActivitiesKind = rawKind === "created" ? "created" : "participations";
  const { user } = useAuth();
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;

  const list = useAsync(
    () => getMyActivities(kind, territoryCode!, user!.id),
    [kind, territoryCode, user?.id],
    { enabled: Boolean(territoryCode && user), errorMessage: "Impossible de charger tes activités." }
  );

  const openActivity = useCallback((activity: Activity) => {
    router.push({ pathname: "/activity/[id]", params: { id: activity.id } });
  }, []);

  const copy = COPY[kind];

  return (
    <>
      <Stack.Screen options={{ title: copy.title }} />
      {list.isLoading ? (
        <View style={styles.skeleton}>
          <ActivityListSkeleton count={3} />
        </View>
      ) : list.error && !list.data ? (
        <ErrorState message={list.error} onRetry={list.refresh} />
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          style={styles.screen}
          data={list.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FadeIn delay={Math.min(index, 6) * 60}>
              <ActivityCard activity={item} onPress={openActivity} />
            </FadeIn>
          )}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={Separator}
          refreshControl={
            <RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={brand.primary} />
          }
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title={copy.empty} message={copy.message} />
          }
        />
      )}
    </>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  skeleton: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  separator: {
    height: Spacing.lg,
  },
});
