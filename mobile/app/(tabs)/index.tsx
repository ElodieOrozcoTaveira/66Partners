import { useCallback, useRef } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { ActivityTile, ACTIVITY_TILE_WIDTH } from "../../src/components/home/ActivityTile";
import { NextActivityHero, NoNextActivity } from "../../src/components/home/NextActivityHero";
import { NotificationBell } from "../../src/components/NotificationBell";
import { SportBubble } from "../../src/components/SportBubble";
import { Avatar } from "../../src/components/ui/Avatar";
import { FadeIn } from "../../src/components/ui/FadeIn";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import { Text } from "../../src/components/ui/Text";
import type { Brand } from "../../src/constants/brands";
import { Colors, Fonts, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { useNearbyCount } from "../../src/hooks/useNearbyCount";
import { useUserLocation } from "../../src/hooks/useUserLocation";
import type { Coordinates } from "../../src/lib/geo";
import { getActivities } from "../../src/services/activities.service";
import { getSports } from "../../src/services/sports.service";
import type { Activity } from "../../src/types/domain";

// Activités autour de toi : les prochaines à venir (non annulées).
const NEARBY_COUNT = 10;
const SPORTS_COUNT = 8;

const byStartDate = (a: Activity, b: Activity) =>
  new Date(a.startDate).getTime() - new Date(b.startDate).getTime();

function greeting(now = new Date()): string {
  const hour = now.getHours();
  return hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
}

export default function HomeScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeTerritory, isLoading: territoryLoading, error: territoryError, refreshTerritories } =
    useTerritory();
  const territoryCode = activeTerritory?.code;
  const userId = user?.id;

  // Position seulement si déjà autorisée (la demande se fait dans Explorer).
  const location = useUserLocation({ ask: false });
  const nearbyCount = useNearbyCount(location.coords);

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
      const [mine, all] = await Promise.all([
        getActivities({ territory: territoryCode!, participantId: userId, from }),
        getActivities({ territory: territoryCode!, from }),
      ]);
      const myActivities = mine.filter((activity) => activity.status !== "CANCELLED").sort(byStartDate);
      const mineIds = new Set(myActivities.map((activity) => activity.id));
      return {
        mine: myActivities,
        // Les miennes sont déjà en haut : pas de doublon dans « autour de toi ».
        nearby: all
          .filter((activity) => activity.status !== "CANCELLED" && !mineIds.has(activity.id))
          .sort(byStartDate)
          .slice(0, NEARBY_COUNT),
      };
    },
    [territoryCode, userId],
    { enabled: Boolean(territoryCode && userId), errorMessage: "Impossible de charger les activités." }
  );

  // Retour sur l'accueil (ex. après avoir créé une activité) : listes rechargées.
  // En-tête coloré : barre d'état claire tant que l'accueil est affiché.
  const { refresh: refreshUpcoming } = upcoming;
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) refreshUpcoming();
      hasFocused.current = true;
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, [refreshUpcoming])
  );

  const openActivity = useCallback((activity: Activity) => {
    router.push({ pathname: "/activity/[id]", params: { id: activity.id } });
  }, []);

  const openExplorer = (sportId?: string) =>
    router.push({ pathname: "/(tabs)/explorer", params: sportId ? { sportId } : {} });
  const openCreate = () => router.push("/(tabs)/create");

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

  const [next, ...otherMine] = upcoming.data?.mine ?? [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={upcoming.isRefreshing}
          onRefresh={refresh}
          tintColor={Colors.textOnPrimary}
          progressViewOffset={insets.top}
        />
      }
    >
      {/* En-tête aux couleurs du territoire, sur son emblème. */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Image source={brand.emblem} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
        <View style={styles.headerTint} />

        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.avatarRing}
          >
            <Avatar uri={user?.avatar} name={user?.pseudo} size={46} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greeting()} {user?.pseudo}
            </Text>
            <Text style={styles.subtitle}>Envie d’une nouvelle aventure ?</Text>
          </View>
          <NotificationBell onColor />
        </View>

        <View style={styles.chips}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Territoire : ${activeTerritory.name}. Changer de territoire`}
            onPress={() => router.push("/territory")}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <Ionicons name="location" size={14} color={Colors.textOnPrimary} />
            <Text style={styles.chipText} numberOfLines={1}>
              {activeTerritory.name}
            </Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textOnPrimary} />
          </Pressable>
          {nearbyCount ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${nearbyCount.count} sportifs dans un rayon de ${nearbyCount.radiusKm} km. Voir la carte`}
              onPress={() => openExplorer()}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Ionicons name="people" size={14} color={Colors.textOnPrimary} />
              <Text style={styles.chipText}>
                {nearbyCount.count} sportif{nearbyCount.count > 1 ? "s" : ""} autour de toi
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Prochaine sortie, à cheval sur l'en-tête. */}
      <View style={styles.heroWrap}>
        {upcoming.isLoading ? (
          <View style={styles.heroPlaceholder} />
        ) : upcoming.error && !upcoming.data ? (
          <View style={styles.errorCard}>
            <ErrorState message={upcoming.error} onRetry={upcoming.refresh} />
          </View>
        ) : next ? (
          <FadeIn>
            <NextActivityHero activity={next} onPress={openActivity} />
          </FadeIn>
        ) : upcoming.data ? (
          <FadeIn>
            <NoNextActivity onCreate={openCreate} onExplore={() => openExplorer()} />
          </FadeIn>
        ) : null}
      </View>

      {sports.data && sports.data.length > 0 ? (
        <FadeIn delay={80} style={styles.section}>
          <SectionHeader title="Sports populaires" actionLabel="Tous" onAction={() => openExplorer()} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {sports.data.map((sport) => (
              <SportBubble key={sport.id} sportName={sport.name} onPress={() => openExplorer(sport.id)} />
            ))}
          </ScrollView>
        </FadeIn>
      ) : null}

      {otherMine.length > 0 ? (
        <FadeIn delay={140} style={styles.section}>
          <SectionHeader title="Tes autres sorties" />
          <Carousel activities={otherMine} onOpen={openActivity} from={location.coords} />
        </FadeIn>
      ) : null}

      {upcoming.data ? (
        <FadeIn delay={200} style={styles.section}>
          <SectionHeader title="À venir autour de toi" actionLabel="Voir tout" onAction={() => openExplorer()} />
          {upcoming.data.nearby.length === 0 ? (
            <View style={styles.padded}>
              <EmptyState
                icon="calendar-outline"
                title="Aucune activité à venir"
                message="Lance la première sortie de ton territoire : d'autres sportifs pourront te rejoindre."
                actionLabel="Créer une activité"
                onAction={openCreate}
              />
            </View>
          ) : (
            <Carousel activities={upcoming.data.nearby} onOpen={openActivity} from={location.coords} />
          )}
        </FadeIn>
      ) : null}
    </ScrollView>
  );
}

function Carousel({
  activities,
  onOpen,
  from,
}: {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
  from: Coordinates | null;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <FlatList
      horizontal
      data={activities}
      keyExtractor={(activity) => activity.id}
      renderItem={({ item }) => <ActivityTile activity={item} onPress={onOpen} from={from} />}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carousel}
      snapToInterval={ACTIVITY_TILE_WIDTH + Spacing.md}
      decelerationRate="fast"
    />
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={8} style={styles.sectionAction}>
          <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={brand.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      paddingBottom: Spacing.xxl,
    },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 64,
      gap: Spacing.lg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: "hidden",
      backgroundColor: brand.primary,
    },
    headerTint: {
      ...StyleSheet.absoluteFill,
      backgroundImage: brand.gradientDiagonal,
      opacity: 0.9,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    avatarRing: {
      borderRadius: 26,
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.85)",
    },
    headerText: {
      flex: 1,
    },
    greeting: {
      fontFamily: Fonts.headingExtraBold,
      fontSize: 22,
      color: Colors.textOnPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.88)",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      maxWidth: "100%",
      paddingHorizontal: Spacing.md,
      paddingVertical: 7,
      borderRadius: Radius.pill,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textOnPrimary,
      flexShrink: 1,
    },
    pressed: {
      opacity: 0.75,
    },
    heroWrap: {
      marginTop: -44,
      paddingHorizontal: Spacing.xl,
    },
    heroPlaceholder: {
      height: 220,
      borderRadius: Radius.lg + 4,
      backgroundColor: Colors.surface,
    },
    errorCard: {
      borderRadius: Radius.lg + 4,
      backgroundColor: Colors.background,
      boxShadow: "0px 8px 24px rgba(31, 41, 55, 0.08)",
    },
    section: {
      marginTop: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      ...Typography.heading,
      fontSize: 19,
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
    row: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    carousel: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
      gap: Spacing.md,
    },
    padded: {
      paddingHorizontal: Spacing.xl,
    },
  });
