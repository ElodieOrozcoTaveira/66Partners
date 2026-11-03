import type { ComponentProps, ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Avatar } from "../../src/components/ui/Avatar";
import { ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { getBrand } from "../../src/constants/brands";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { formatMonthYear } from "../../src/lib/date";
import { formatTimeSlot, LEVEL_LABELS, WEEKDAYS, WEEKDAY_LABELS } from "../../src/lib/labels";
import { resolveMediaUrl } from "../../src/services/api";
import { getMemberStats } from "../../src/services/profileStats";
import { getUserFavoriteSports } from "../../src/services/sports.service";
import type { UserSport } from "../../src/types/domain";
import {
  getPublicUser,
  getUserAvailabilities,
  getUserSports,
} from "../../src/services/user.service";
import { SportBadgeRow } from "../../src/components/SportBadgeRow";
import { useModeration } from "../../src/hooks/useModeration";

const COVER_HEIGHT = 150;
const AVATAR_SIZE = 104;

/**
 * Profil public d'un membre (GET /users/:id), ouvert depuis une activité.
 * Même contenu que la page web /profile/:userId : identité, à propos,
 * statistiques, disponibilités et sports. Jamais d'email.
 */
export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { user: me } = useAuth();
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;
  const isMe = Boolean(me && id === me.id);
  const { showMenu, reportModal } = useModeration();

  const profile = useAsync(
    async () => {
      const [member, favorites, practiced, availabilities] = await Promise.all([
        getPublicUser(id),
        getUserFavoriteSports(id).catch(() => []),
        getUserSports(id).catch(() => []),
        getUserAvailabilities(id).catch(() => []),
      ]);
      // Ses sports = favoris (ce qu'il affiche sur son profil, comme le web),
      // complétés par les sports pratiqués ; niveau affiché quand il est connu.
      const levels = new Map(practiced.map((sport) => [sport.sportId, sport.level]));
      const sports: { id: string; name: string; level?: UserSport["level"] }[] = favorites.map(
        (sport) => ({ id: sport.id, name: sport.name, level: levels.get(sport.id) })
      );
      for (const sport of practiced) {
        if (!sports.some((item) => item.id === sport.sportId)) {
          sports.push({ id: sport.sportId, name: sport.sportName, level: sport.level });
        }
      }
      return { member, sports, availabilities };
    },
    [id],
    { enabled: Boolean(id) && !isMe, errorMessage: "Ce profil est introuvable." }
  );

  // Chargées à part : un échec des statistiques n'empêche pas d'afficher le profil.
  const stats = useAsync(() => getMemberStats(territoryCode!, id), [id, territoryCode], {
    enabled: Boolean(id && territoryCode) && !isMe,
    errorMessage: "Statistiques indisponibles.",
  });

  // Son propre profil : même comportement que le site, on bascule sur « Mon profil ».
  if (isMe) return <Redirect href="/(tabs)/profile" />;

  if (profile.isLoading) return <LoadingState />;
  if (profile.error || !profile.data) {
    return <ErrorState message={profile.error ?? "Ce profil est introuvable."} onRetry={profile.refresh} />;
  }

  const { member, sports, availabilities } = profile.data;
  const cover = resolveMediaUrl(member.coverPhoto);
  const location = member.city ?? member.territory?.name ?? null;
  const sortedSlots = [...availabilities].sort(
    (a, b) =>
      WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
      a.startTime.localeCompare(b.startTime)
  );

  const refreshAll = () => {
    profile.refresh();
    stats.refresh();
  };
  const stat = (value: number | undefined) => (value === undefined ? "–" : String(value));

  return (
    <>
      <Stack.Screen
        options={{
          title: member.pseudo,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Signaler ou bloquer ${member.pseudo}`}
              hitSlop={10}
              onPress={() =>
                showMenu({
                  title: member.pseudo,
                  report: { context: "PROFILE", targetId: member.id, label: "Signaler ce membre" },
                  block: { userId: member.id, pseudo: member.pseudo },
                  onBlocked: () => (router.canGoBack() ? router.back() : router.replace("/(tabs)")),
                })
              }
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={brand.primary} />
            </Pressable>
          ),
        }}
      />
      {reportModal}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={profile.isRefreshing}
            onRefresh={refreshAll}
            tintColor={brand.primary}
          />
        }
      >
        {/* Couverture + photo de profil */}
        <View style={styles.cover}>
          {/* Photo de couverture du membre, sinon l'emblème de son territoire
              (comme le web, qui retombe sur le visuel du territoire). */}
          <Image
            source={cover ?? getBrand(member.territory?.code ?? activeTerritory?.code).emblem}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessible={false}
          />
        </View>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Avatar uri={member.avatar} name={member.pseudo} size={AVATAR_SIZE} />
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.pseudo} accessibilityRole="header">
            {member.pseudo}
          </Text>
          {location ? (
            <View style={styles.row}>
              <Ionicons name="location" size={16} color={brand.primary} />
              <Text style={styles.caption}>{location}</Text>
            </View>
          ) : null}
          {member.headline ? <Text style={styles.headline}>{member.headline}</Text> : null}
        </View>

        <View style={styles.sections}>
          {/* Statistiques */}
          <View style={styles.statsCard}>
            <View style={styles.row}>
              <Ionicons name="stats-chart" size={18} color={brand.primary} />
              <Text style={styles.cardTitle}>Son activité</Text>
            </View>
            {stats.error && !stats.data ? (
              <Text style={styles.muted}>{stats.error}</Text>
            ) : (
              <View style={styles.stats}>
                <Stat icon="shoe-sneaker" value={stat(stats.data?.joined)} label="sorties" />
                <View style={styles.statDivider} />
                <Stat icon="calendar-star" value={stat(stats.data?.organized)} label="organisées" />
                <View style={styles.statDivider} />
                <Stat icon="account-group" value={stat(stats.data?.partners)} label="partenaires" />
              </View>
            )}
          </View>

          {/* À propos */}
          <Card icon="person" title="À propos">
            {member.lookingFor ? (
              <InfoLine icon="search" label="Recherche" value={member.lookingFor} />
            ) : null}
            {member.territory ? (
              <InfoLine icon="map" label="Territoire" value={member.territory.name} />
            ) : null}
            <InfoLine
              icon="calendar"
              label="Membre depuis"
              value={formatMonthYear(member.createdAt)}
            />
          </Card>

          {/* Sports pratiqués */}
          <Card icon="medal" title="Ses sports">
            {sports.length === 0 ? (
              <Text style={styles.muted}>Aucun sport renseigné.</Text>
            ) : (
              // Logos seuls (comme les pins d'Explorer) ; toucher affiche le nom.
              <SportBadgeRow
                sports={sports.map((sport) => ({
                  id: sport.id,
                  name: sport.name,
                  detail: sport.level ? LEVEL_LABELS[sport.level] : undefined,
                }))}
              />
            )}
          </Card>

          {/* Disponibilités */}
          <Card icon="time" title="Ses disponibilités">
            {sortedSlots.length === 0 ? (
              <Text style={styles.muted}>Aucune disponibilité renseignée.</Text>
            ) : (
              <View style={styles.chips}>
                {sortedSlots.map((slot) => (
                  <View key={slot.id} style={styles.slotChip}>
                    <Text style={styles.slotDay}>{WEEKDAY_LABELS[slot.weekday]}</Text>
                    <Text style={styles.slotTime}>
                      {formatTimeSlot(slot.startTime)} – {formatTimeSlot(slot.endTime)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>
    </>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  children: ReactNode;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={icon} size={18} color={brand.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <Text style={styles.infoText}>
        <Text style={styles.infoLabel}>{label} : </Text>
        {value}
      </Text>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  value: string;
  label: string;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <MaterialCommunityIcons name={icon} size={26} color={brand.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    cover: {
      height: COVER_HEIGHT,
      backgroundColor: brand.primary,
      backgroundImage: brand.gradientDiagonal,
      overflow: "hidden",
    },
    avatarWrap: {
      alignItems: "center",
      marginTop: -AVATAR_SIZE / 2,
    },
    avatarRing: {
      padding: 4,
      borderRadius: AVATAR_SIZE,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    identity: {
      alignItems: "center",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.xl,
      marginTop: Spacing.md,
    },
    pseudo: {
      ...Typography.title,
      fontSize: 26,
      textAlign: "center",
    },
    headline: {
      ...Typography.body,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    caption: {
      ...Typography.caption,
      fontSize: 15,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    sections: {
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      gap: Spacing.md,
    },
    card: {
      padding: Spacing.lg,
      gap: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    cardTitle: {
      ...Typography.subheading,
      fontSize: 18,
    },
    muted: {
      ...Typography.caption,
      fontSize: 14,
    },
    statsCard: {
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: Colors.surface,
      gap: Spacing.md,
    },
    stats: {
      flexDirection: "row",
      alignItems: "center",
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: Colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "800",
      color: Colors.text,
    },
    statLabel: {
      ...Typography.caption,
      fontSize: 14,
      color: Colors.text,
    },
    infoLine: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    infoText: {
      ...Typography.body,
      flex: 1,
    },
    infoLabel: {
      fontWeight: "700",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    slotChip: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: Colors.surface,
    },
    slotDay: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.text,
    },
    slotTime: {
      ...Typography.caption,
      fontSize: 13,
    },
  });
