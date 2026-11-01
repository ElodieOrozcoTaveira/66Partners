import { useCallback, useRef } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ActivityCard } from "../../src/components/ActivityCard";
import { ActivityListSkeleton } from "../../src/components/ActivityCardSkeleton";
import { NotificationBell } from "../../src/components/NotificationBell";
import { SportBubble } from "../../src/components/SportBubble";
import { Avatar } from "../../src/components/ui/Avatar";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import { Colors, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { getActivities } from "../../src/services/activities.service";
import { getSports } from "../../src/services/sports.service";
import type { Activity } from "../../src/types/domain";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import type { Brand } from "../../src/constants/brands";

// Activités autour de toi : les 3 dernières créées (à venir, non annulées).
const PREVIEW_COUNT = 3;
const SPORTS_COUNT = 8;

export default function HomeScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { user } = useAuth();
  const { activeTerritory, isLoading: territoryLoading, error: territoryError, refreshTerritories } =
    useTerritory();
  const territoryCode = activeTerritory?.code;
  const userId = user?.id;

  // Sports les plus pratiqués d'abord (compteur fourni par GET /sports).
  const sports = useAsync(
    async () =>
      (await getSports())
        .slice()
        .sort((a, b) => b.activitiesCount - a.activitiesCount)
        .slice(0, SPORTS_COUNT),
    [],
    { errorMessage: "Impossible de récupérer les sports." }
  );

  // Mes prochaines activités (participation acceptée) + à venir autour de moi.
  const upcoming = useAsync(
    async () => {
      const from = new Date().toISOString();
      const [mine, nearby] = await Promise.all([
        getActivities({ territory: territoryCode!, participantId: userId, from }),
        getActivities({ territory: territoryCode!, from }),
      ]);
      return {
        mine: mine.filter((activity) => activity.status !== "CANCELLED"),
        // Y compris celles que l'utilisateur organise : sinon la section restait
        // vide quand les seules activités à venir étaient les siennes.
        nearby: nearby
          .filter((activity) => activity.status !== "CANCELLED")
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, PREVIEW_COUNT),
      };
    },
    [territoryCode, userId],
    { enabled: Boolean(territoryCode && userId), errorMessage: "Impossible de charger les activités." }
  );

  // Retour sur l'accueil (ex. après avoir créé une activité) : listes rechargées.
  const { refresh: refreshUpcoming } = upcoming;
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) refreshUpcoming();
      hasFocused.current = true;
    }, [refreshUpcoming])
  );

  const openActivity = useCallback((activity: Activity) => {
    router.push({ pathname: "/activity/[id]", params: { id: activity.id } });
  }, []);

  const openExplorer = (sportId?: string) =>
    router.push({ pathname: "/(tabs)/explorer", params: sportId ? { sportId } : {} });

  if (territoryLoading) return <LoadingState />;
  if (territoryError || !activeTerritory) {
    return (
      <ErrorState message="Impossible de déterminer ton territoire." onRetry={refreshTerritories} />
    );
  }

  const refresh = () => {
    upcoming.refresh();
    sports.refresh();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mon profil"
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Avatar uri={user?.avatar} name={user?.pseudo} size={46} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.greeting} numberOfLines={1}>
            Bonjour {user?.pseudo} !
          </Text>
          <Text style={styles.subtitle}>Envie d’une nouvelle aventure ?</Text>
        </View>
        <NotificationBell />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={upcoming.isRefreshing}
            onRefresh={refresh}
            tintColor={brand.primary}
          />
        }
      >
        {sports.data && sports.data.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sports}
          >
            {sports.data.map((sport) => (
              <SportBubble
                key={sport.id}
                sportName={sport.name}
                onPress={() => openExplorer(sport.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        {upcoming.isLoading ? (
          <View style={styles.skeleton}>
            <ActivityListSkeleton count={2} />
          </View>
        ) : upcoming.error && !upcoming.data ? (
          <ErrorState message={upcoming.error} onRetry={upcoming.refresh} />
        ) : upcoming.data ? (
          <>
            {upcoming.data.mine.length > 0 ? (
              <Section title="Mes prochaines activités">
                {upcoming.data.mine.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} onPress={openActivity} />
                ))}
              </Section>
            ) : null}

            <Section
              title="Activités autour de toi"
              actionLabel="Voir tout"
              onAction={() => openExplorer()}
            >
              {upcoming.data.nearby.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="Aucune activité à venir"
                  message="Lance la première sortie de ton territoire : d'autres sportifs pourront te rejoindre."
                  actionLabel="Créer une activité"
                  onAction={() => router.push("/(tabs)/create")}
                />
              ) : (
                upcoming.data.nearby.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} onPress={openActivity} />
                ))
              )}
            </Section>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="link"
            onPress={onAction}
            hitSlop={8}
            style={styles.sectionAction}
          >
            <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
            <Ionicons name="chevron-forward" size={14} color={brand.primary} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    ...Typography.heading,
  },
  subtitle: {
    ...Typography.caption,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  sports: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subheading,
    fontSize: 18,
  },
  skeleton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sectionActionLabel: {
    color: brand.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  sectionBody: {
    gap: Spacing.lg,
  },
});
