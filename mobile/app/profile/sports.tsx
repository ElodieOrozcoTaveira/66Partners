import { useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput } from "../../src/components/ui/Text";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { AvailabilityEditor } from "../../src/components/AvailabilityEditor";
import { ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useAsync } from "../../src/hooks/useAsync";
import { WEEKDAYS } from "../../src/lib/labels";
import { getSportVisual } from "../../src/lib/sportVisuals";
import { getApiErrorMessage } from "../../src/services/api";
import { getMyFavoriteSportIds, getSports, toggleFavoriteSport } from "../../src/services/sports.service";
import { getMyAvailabilities } from "../../src/services/user.service";
import type { Sport } from "../../src/types/domain";
import { haptics } from "../../src/lib/haptics";
import { SportBadgeRow } from "../../src/components/SportBadgeRow";

/** Ignore accents et casse : "randonnee" trouve "Randonnée". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Mes sports favoris (même notion que le web : GET /sports/favorites/mine,
 * POST /sports/:id/favorite) + disponibilités modifiables.
 */
export default function MySportsScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  // Bascules en cours d'envoi : évite les doubles appels sur un même sport.
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const data = useAsync(
    async () => {
      const [sports, favoriteIds, availabilities] = await Promise.all([
        getSports(),
        getMyFavoriteSportIds(),
        getMyAvailabilities(),
      ]);
      return {
        sports: [...sports].sort((a, b) => a.name.localeCompare(b.name, "fr")),
        favoriteIds: new Set(favoriteIds),
        availabilities: [...availabilities].sort(
          (a, b) =>
            WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
            a.startTime.localeCompare(b.startTime)
        ),
      };
    },
    [user?.id],
    { enabled: Boolean(user), errorMessage: "Impossible de charger tes sports." }
  );
  const { setData } = data;

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return (data.data?.sports ?? []).filter((sport) => !needle || normalize(sport.name).includes(needle));
  }, [data.data, query]);

  const setFavorite = (sportId: string, favorite: boolean) =>
    setData((current) => {
      if (!current) return current;
      const favoriteIds = new Set(current.favoriteIds);
      if (favorite) favoriteIds.add(sportId);
      else favoriteIds.delete(sportId);
      return { ...current, favoriteIds };
    });

  const toggle = async (sport: Sport) => {
    if (!data.data || pending.has(sport.id)) return;
    const wasFavorite = data.data.favoriteIds.has(sport.id);
    haptics.selection();
    // Affichage immédiat, annulé si le serveur refuse.
    setFavorite(sport.id, !wasFavorite);
    setPending((current) => new Set(current).add(sport.id));
    try {
      const favorited = await toggleFavoriteSport(sport.id);
      setFavorite(sport.id, favorited);
    } catch (err) {
      setFavorite(sport.id, wasFavorite);
      Alert.alert("Action impossible", getApiErrorMessage(err, "Impossible de mettre à jour tes sports."));
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(sport.id);
        return next;
      });
    }
  };

  if (data.isLoading) return <LoadingState />;
  if (!data.data) {
    return <ErrorState message={data.error ?? "Erreur de chargement."} onRetry={data.refresh} />;
  }

  const { sports, favoriteIds, availabilities } = data.data;
  const favorites = sports.filter((sport) => favoriteIds.has(sport.id));

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl refreshing={data.isRefreshing} onRefresh={data.refresh} tintColor={brand.primary} />
      }
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="heart" size={18} color={brand.primary} />
          <Text style={styles.title} accessibilityRole="header">
            Mes sports favoris
          </Text>
          <Text style={styles.count}>{favorites.length}</Text>
        </View>
        {favorites.length === 0 ? (
          <Text style={styles.caption}>
            Touche le cœur d’un sport ci-dessous pour l’ajouter. Tes favoris apparaissent sur ton profil.
          </Text>
        ) : (
          <>
            {/* Mêmes pastilles que le profil : toucher affiche le nom du sport. */}
            <SportBadgeRow sports={favorites} size={44} />
            <Text style={styles.hint}>Touche une pastille pour voir le sport, ou un cœur ci-dessous pour le retirer.</Text>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Tous les sports
      </Text>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un sport"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Rechercher un sport"
          autoCorrect={false}
        />
      </View>

      <View style={styles.grid}>
        {filtered.map((sport) => {
          const favorite = favoriteIds.has(sport.id);
          const visual = getSportVisual(sport.name);
          return (
            <Pressable
              key={sport.id}
              accessibilityRole="switch"
              accessibilityState={{ checked: favorite }}
              accessibilityLabel={`${sport.name}, favori`}
              onPress={() => toggle(sport)}
              style={({ pressed }) => [styles.tile, favorite && styles.tileFavorite, pressed && styles.pressed]}
            >
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={18}
                color={favorite ? brand.primary : Colors.textMuted}
                style={styles.heart}
              />
              <View style={[styles.tileIcon, { backgroundColor: `${visual.color}1F` }]}>
                <MaterialCommunityIcons name={visual.icon} size={24} color={visual.color} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={1}>
                {sport.name}
              </Text>
            </Pressable>
          );
        })}
        {filtered.length === 0 ? <Text style={styles.caption}>Aucun sport ne correspond.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          Mes disponibilités
        </Text>
        <AvailabilityEditor
          availabilities={availabilities}
          onChange={(next) => setData((current) => (current ? { ...current, availabilities: next } : current))}
        />
      </View>
    </ScrollView>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    pressed: {
      opacity: 0.7,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    title: {
      ...Typography.subheading,
      fontSize: 18,
      flex: 1,
    },
    count: {
      minWidth: 26,
      textAlign: "center",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      overflow: "hidden",
      fontSize: 13,
      fontWeight: "700",
      color: brand.primary,
      backgroundColor: brand.primarySoft,
    },
    caption: {
      ...Typography.caption,
      fontSize: 14,
    },
    body: {
      ...Typography.body,
      flexShrink: 1,
    },
    link: {
      color: brand.primary,
      fontWeight: "600",
      fontSize: 14,
    },
    hint: {
      ...Typography.caption,
    },
    sectionTitle: {
      ...Typography.subheading,
      fontSize: 18,
      marginTop: Spacing.sm,
    },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 46,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
      paddingVertical: Spacing.sm,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    tile: {
      width: "31.5%",
      alignItems: "center",
      gap: Spacing.xs,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      paddingHorizontal: Spacing.xs,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    tileFavorite: {
      borderColor: brand.primary,
      backgroundColor: brand.primarySoft,
    },
    heart: {
      position: "absolute",
      top: 6,
      right: 6,
    },
    tileIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    tileLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
  });
