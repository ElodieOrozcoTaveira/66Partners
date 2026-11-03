import { useCallback, useRef } from "react";
import { Alert, Image as RNImage, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setStatusBarStyle } from "expo-status-bar";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { AvatarEditor } from "../../src/components/AvatarEditor";
import { LEGAL_URLS } from "../../src/config/env";
import type { Brand } from "../../src/constants/brands";
import { Colors, Fonts, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
import { formatMonthYear } from "../../src/lib/date";
import { resolveMediaUrl } from "../../src/services/api";
import { FadeIn } from "../../src/components/ui/FadeIn";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { getMyActivities } from "../../src/services/profileStats";
import { getMyFavoriteSports } from "../../src/services/sports.service";
import { SportBadge } from "../../src/components/SportBadge";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function ProfileScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;

  // Statistiques calculées à partir des données réelles (aucun chiffre fictif).
  const data = useAsync(
    async () => {
      const [sports, participations, created] = await Promise.all([
        getMyFavoriteSports(),
        getMyActivities("participations", territoryCode!, user!.id),
        getMyActivities("created", territoryCode!, user!.id),
      ]);
      return { sports, participations: participations.length, created: created.length };
    },
    [user?.id, territoryCode],
    { enabled: Boolean(user && territoryCode), errorMessage: "Impossible de charger ton activité." }
  );
  const { refresh } = data;

  // Retour sur l'onglet (ex. après "Mes sports") : chiffres et favoris rechargés.
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) refresh();
      hasFocused.current = true;
      // Bannière colorée : barre d'état claire tant que l'onglet est affiché.
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, [refresh])
  );

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Veux-tu vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => void logout() },
    ]);
  };

  if (!user) return null;

  const stat = (value: number | undefined) => (value === undefined ? "–" : String(value));

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={data.isRefreshing}
          onRefresh={data.refresh}
          tintColor={Colors.textOnPrimary}
          progressViewOffset={insets.top}
        />
      }
    >
      {/* Bannière : photo de couverture, sinon l'emblème du territoire. */}
      <View style={[styles.banner, { height: insets.top + 150 }]}>
        <Image
          source={resolveMediaUrl(user.coverPhoto) ?? brand.emblem}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
        />
        <View style={styles.bannerTint} />
        <View style={[styles.bannerBar, { paddingTop: insets.top + Spacing.sm }]}>
          <Text style={styles.bannerTitle}>Mon profil</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paramètres"
            onPress={() => router.push("/settings")}
            hitSlop={10}
            style={({ pressed }) => [styles.bannerButton, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textOnPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {/* Identité, centrée sous la bannière */}
        <View style={styles.identity}>
          <View style={styles.avatarRing}>
            <AvatarEditor size={104} />
          </View>
          <Text style={styles.pseudo} numberOfLines={1} accessibilityRole="header">
            {user.pseudo}
          </Text>
          <View style={styles.identityMeta}>
            {user.city || activeTerritory ? (
              <View style={styles.row}>
                <Ionicons name="location" size={14} color={brand.primary} />
                <Text style={styles.caption} numberOfLines={1}>
                  {user.city ?? activeTerritory?.name}
                </Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Ionicons name="sparkles" size={14} color={brand.primary} />
              <Text style={styles.caption}>Membre depuis {formatMonthYear(user.createdAt)}</Text>
            </View>
          </View>
          {user.headline ? (
            <Text style={styles.headline} numberOfLines={2}>
              {user.headline}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile/edit")}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <Ionicons name="pencil" size={15} color={brand.primary} />
            <Text style={styles.editLabel}>Modifier mon profil</Text>
          </Pressable>
        </View>

        {/* Mon activité */}
        <FadeIn>
          {data.error && !data.data ? (
            <Text style={styles.error}>{data.error}</Text>
          ) : (
            <View style={styles.stats} accessibilityLabel="Mon activité">
              <Stat icon="shoe-sneaker" value={stat(data.data?.participations)} label="Sorties" />
              <Stat icon="calendar-star" value={stat(data.data?.created)} label="Créées" />
              <Stat icon="medal" value={stat(data.data?.sports.length)} label="Sports" />
            </View>
          )}
        </FadeIn>

        {/* Territoire actif (menu latéral de la maquette) */}
        {activeTerritory ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Territoire actif : ${activeTerritory.name}. Changer de territoire`}
            onPress={() => router.push("/territory")}
            style={({ pressed }) => [styles.card, styles.territoryCard, pressed && styles.pressed]}
          >
            <RNImage source={brand.logo} resizeMode="contain" style={styles.territoryLogo} accessible={false} />
            <View style={styles.identityText}>
              <Text style={styles.territoryLabel}>Territoire actif</Text>
              <Text style={styles.territoryName}>{activeTerritory.name}</Text>
            </View>
            <Text style={styles.territoryAction}>Changer</Text>
            <Ionicons name="chevron-forward" size={18} color={brand.primary} />
          </Pressable>
        ) : null}

        {/* Raccourcis */}
        <View style={styles.links}>
          <LinkCard icon="heart" label="Mes sports" onPress={() => router.push("/profile/sports")}>
            <View style={styles.sportIcons}>
              {/* Mêmes pastilles que les pins de la carte Explorer. */}
              {data.data?.sports.slice(0, 4).map((sport) => (
                <SportBadge key={sport.id} name={sport.name} size={30} />
              ))}
            </View>
          </LinkCard>
          <LinkCard
            icon="trophy"
            label="Mes participations"
            onPress={() =>
              router.push({ pathname: "/profile/activities", params: { kind: "participations" } })
            }
          />
          <LinkCard
            icon="calendar"
            label="Mes activités créées"
            onPress={() => router.push({ pathname: "/profile/activities", params: { kind: "created" } })}
          />
          <LinkCard icon="mail" label="Messages" onPress={() => router.push("/(tabs)/messages")} />
        </View>

        {/* Compte et confidentialité */}
        <View style={[styles.row, styles.sectionHeader]}>
          <Ionicons name="shield" size={20} color={Colors.text} />
          <Text style={styles.cardTitle}>Compte et confidentialité</Text>
        </View>
        <View style={styles.list}>
          <ListItem icon="settings" label="Paramètres du compte" onPress={() => router.push("/settings")} />
          <ListItem
            icon="shield-checkmark"
            label="Confidentialité"
            onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
          />
          <ListItem
            icon="help-circle"
            label="Aide et contact"
            onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.faq)}
            last
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={22} color={brand.primary} />
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  value: string;
  label: string;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <View style={styles.statIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={brand.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LinkCard({
  icon,
  label,
  onPress,
  children,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.linkCard, pressed && styles.pressed]}
    >
      <View style={styles.linkIcon}>
        <Ionicons name={icon} size={24} color={Colors.textOnPrimary} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      {children}
      <Ionicons name="chevron-forward" size={20} color={Colors.text} />
    </Pressable>
  );
}

function ListItem({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.listItem, !last && styles.listDivider, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={brand.primary} />
      <Text style={styles.listLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.text} />
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    scroll: {
      paddingBottom: Spacing.xxl,
    },
    banner: {
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: "hidden",
      backgroundColor: brand.primary,
    },
    bannerTint: {
      ...StyleSheet.absoluteFill,
      backgroundImage: brand.gradientDiagonal,
      opacity: 0.85,
    },
    bannerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
    },
    bannerTitle: {
      fontFamily: Fonts.headingExtraBold,
      fontSize: 22,
      color: Colors.textOnPrimary,
    },
    bannerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    content: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    pressed: {
      opacity: 0.75,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    card: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    identity: {
      alignItems: "center",
      gap: Spacing.xs,
      marginTop: -56,
      marginBottom: Spacing.sm,
    },
    avatarRing: {
      padding: 4,
      borderRadius: 60,
      backgroundColor: Colors.background,
      boxShadow: "0px 6px 18px rgba(31, 41, 55, 0.15)",
      marginBottom: Spacing.xs,
    },
    identityMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: Spacing.md,
      rowGap: 2,
    },
    identityText: {
      flex: 1,
      gap: Spacing.xs,
    },
    pseudo: {
      ...Typography.title,
      fontSize: 26,
      textAlign: "center",
    },
    caption: {
      ...Typography.caption,
      fontSize: 14,
      flexShrink: 1,
    },
    headline: {
      ...Typography.body,
      textAlign: "center",
      color: Colors.textSecondary,
      paddingHorizontal: Spacing.lg,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      minHeight: 40,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.pill,
      backgroundColor: brand.primarySoft,
    },
    editLabel: {
      fontWeight: "700",
      fontSize: 14,
      color: brand.primary,
    },
    territoryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
    },
    territoryLogo: {
      width: 64,
      height: 38,
    },
    territoryLabel: {
      ...Typography.caption,
      fontSize: 12,
    },
    territoryName: {
      ...Typography.subheading,
    },
    territoryAction: {
      color: brand.primary,
      fontWeight: "700",
      fontSize: 14,
    },
    cardTitle: {
      ...Typography.subheading,
      fontSize: 18,
    },
    error: {
      color: Colors.danger,
      fontSize: 14,
    },
    stats: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: 2,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Shadow.card,
    },
    statIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      backgroundColor: brand.primarySoft,
    },
    statValue: {
      fontFamily: Fonts.headingExtraBold,
      fontSize: 24,
      color: Colors.text,
    },
    statLabel: {
      ...Typography.caption,
      fontSize: 13,
    },
    links: {
      gap: Spacing.sm,
    },
    linkCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingLeft: Spacing.sm,
      paddingRight: Spacing.md,
    },
    linkIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primary,
      backgroundImage: brand.gradientDiagonal,
    },
    linkLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
    },
    sportIcons: {
      flexDirection: "row",
      gap: 4,
    },
    sectionHeader: {
      marginTop: Spacing.md,
    },
    list: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      paddingHorizontal: Spacing.lg,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      minHeight: 52,
    },
    listDivider: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    listLabel: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
    },
    logout: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      minHeight: 52,
      marginTop: Spacing.sm,
      borderRadius: Radius.pill,
      backgroundColor: brand.primarySoft,
    },
    logoutLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: brand.primary,
    },
  });
