import { useCallback, useRef } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { AvatarEditor } from "../../src/components/AvatarEditor";
import { LEGAL_URLS } from "../../src/config/env";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Image source={brand.logo} resizeMode="contain" style={styles.logo} accessible={false} />
        <Text style={styles.screenTitle} accessibilityRole="header">
          Mon profil
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paramètres"
          onPress={() => router.push("/settings")}
          hitSlop={10}
        >
          <Ionicons name="settings-outline" size={26} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={data.isRefreshing} onRefresh={data.refresh} tintColor={brand.primary} />
        }
      >
        {/* Carte d'identité */}
        <View style={[styles.card, styles.identity]}>
          <AvatarEditor size={96} />
          <View style={styles.identityText}>
            <Text style={styles.pseudo} numberOfLines={1}>
              {user.pseudo}
            </Text>
            {activeTerritory || user.city ? (
              <View style={styles.row}>
                <Ionicons name="location" size={16} color={brand.primary} />
                <Text style={styles.caption} numberOfLines={1}>
                  {user.city ?? activeTerritory?.name}
                </Text>
              </View>
            ) : null}
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
              <Ionicons name="pencil" size={16} color={Colors.text} />
              <Text style={styles.editLabel}>Modifier mon profil</Text>
            </Pressable>
          </View>
        </View>

        {/* Territoire actif (menu latéral de la maquette) */}
        {activeTerritory ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Territoire actif : ${activeTerritory.name}. Changer de territoire`}
            onPress={() => router.push("/territory")}
            style={({ pressed }) => [styles.card, styles.territoryCard, pressed && styles.pressed]}
          >
            <Image source={brand.logo} resizeMode="contain" style={styles.territoryLogo} accessible={false} />
            <View style={styles.identityText}>
              <Text style={styles.territoryLabel}>Territoire actif</Text>
              <Text style={styles.territoryName}>{activeTerritory.name}</Text>
            </View>
            <Text style={styles.territoryAction}>Changer</Text>
            <Ionicons name="chevron-forward" size={18} color={brand.primary} />
          </Pressable>
        ) : null}

        {/* Mon activité */}
        <View style={styles.statsCard}>
          <View style={styles.row}>
            <Ionicons name="stats-chart" size={18} color={brand.primary} />
            <Text style={styles.cardTitle}>Mon activité</Text>
          </View>
          {data.error && !data.data ? (
            <Text style={styles.error}>{data.error}</Text>
          ) : (
            <View style={styles.stats}>
              <Stat icon="shoe-sneaker" value={stat(data.data?.participations)} label="sorties" />
              <View style={styles.statDivider} />
              <Stat icon="calendar-star" value={stat(data.data?.created)} label="créées" />
              <View style={styles.statDivider} />
              <Stat icon="medal" value={stat(data.data?.sports.length)} label="sports" />
            </View>
          )}
        </View>

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
      </ScrollView>
    </SafeAreaView>
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
      <MaterialCommunityIcons name={icon} size={26} color={brand.primary} />
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
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    logo: {
      width: 92,
      height: 52,
    },
    screenTitle: {
      ...Typography.title,
      fontSize: 24,
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
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
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.lg,
      padding: Spacing.lg,
    },
    identityText: {
      flex: 1,
      gap: Spacing.xs,
    },
    pseudo: {
      ...Typography.title,
      fontSize: 24,
    },
    caption: {
      ...Typography.caption,
      fontSize: 15,
      flexShrink: 1,
    },
    headline: {
      ...Typography.caption,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      minHeight: 42,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.pill,
      borderWidth: 2,
      borderColor: brand.primary,
    },
    editLabel: {
      fontWeight: "700",
      fontSize: 14,
      color: Colors.text,
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
    statsCard: {
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: Colors.surface,
      gap: Spacing.md,
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
