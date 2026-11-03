import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../ui/Text";
import { PressableScale } from "../ui/PressableScale";
import { SportIcon } from "../SportIcon";
import type { Brand } from "../../constants/brands";
import { Colors, Fonts, Gradients, Radius, Spacing } from "../../constants/theme";
import { useBrand, useBrandStyles } from "../../context/BrandContext";
import { formatActivityWhen, formatStartsIn } from "../../lib/date";
import { getSportPhoto } from "../../lib/sportPhotos";
import type { Activity } from "../../types/domain";

interface NextActivityHeroProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
}

/** Grande carte « Ta prochaine sortie », avec compte à rebours. */
export function NextActivityHero({ activity, onPress }: NextActivityHeroProps) {
  const styles = useBrandStyles(makeStyles);
  const startsIn = formatStartsIn(activity.startDate);
  const when = formatActivityWhen(activity.startDate);
  // Le créateur n'est pas compté dans participantsCount.
  const people = activity.participantsCount + 1;

  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      accessibilityLabel={`Ta prochaine sortie : ${activity.title}, ${startsIn.toLowerCase()}, ${when}, ${activity.city}`}
      onPress={() => onPress(activity)}
      style={styles.card}
    >
      <Image
        source={getSportPhoto(activity.sportName)}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessible={false}
        transition={200}
      />
      <View style={styles.shade} />

      <View style={styles.top}>
        <View style={styles.countdown}>
          <Ionicons name="time" size={14} color={Colors.text} />
          <Text style={styles.countdownText}>{startsIn}</Text>
        </View>
        <View style={styles.sport}>
          <SportIcon sportName={activity.sportName} size={36} />
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.kicker}>Ta prochaine sortie</Text>
        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        <View style={styles.metaRow}>
          <Meta icon="calendar" text={when} />
        </View>
        <View style={styles.metaRow}>
          <Meta icon="location" text={activity.city} />
          <Meta icon="people" text={`${people} sportif${people > 1 ? "s" : ""}`} />
        </View>
      </View>
    </PressableScale>
  );
}

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.9)" />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

/** Pas de sortie prévue : invitation à en créer une ou à explorer. */
export function NoNextActivity({ onCreate, onExplore }: { onCreate: () => void; onExplore: () => void }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="flag" size={22} color={brand.primary} />
      </View>
      <Text style={styles.emptyTitle}>Aucune sortie prévue</Text>
      <Text style={styles.emptyText}>Lance une activité ou rejoins des sportifs près de chez toi.</Text>
      <View style={styles.emptyActions}>
        <PressableScale haptic accessibilityRole="button" onPress={onCreate} style={styles.primaryButton}>
          <Ionicons name="add" size={18} color={Colors.textOnPrimary} />
          <Text style={styles.primaryLabel}>Créer</Text>
        </PressableScale>
        <PressableScale accessibilityRole="button" onPress={onExplore} style={styles.secondaryButton}>
          <Ionicons name="compass-outline" size={18} color={brand.primary} />
          <Text style={styles.secondaryLabel}>Explorer</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    card: {
      height: 220,
      borderRadius: Radius.lg + 4,
      overflow: "hidden",
      justifyContent: "space-between",
      backgroundColor: brand.primaryDark,
      boxShadow: brand.raisedShadow,
    },
    shade: {
      ...StyleSheet.absoluteFill,
      backgroundImage: Gradients.photoShade,
    },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: Spacing.md,
    },
    countdown: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: brand.accent,
      backgroundImage: brand.badgeGradient,
    },
    countdownText: {
      fontSize: 13,
      fontWeight: "800",
      color: Colors.text,
    },
    sport: {
      borderRadius: 20,
      borderWidth: 2,
      borderColor: Colors.background,
    },
    bottom: {
      padding: Spacing.lg,
      gap: 4,
    },
    kicker: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.85)",
    },
    title: {
      fontFamily: Fonts.headingExtraBold,
      fontSize: 22,
      lineHeight: 27,
      color: Colors.textOnPrimary,
    },
    metaRow: {
      flexDirection: "row",
      gap: Spacing.lg,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexShrink: 1,
    },
    metaText: {
      fontSize: 13,
      fontWeight: "500",
      color: "rgba(255,255,255,0.95)",
      flexShrink: 1,
    },
    empty: {
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.xl,
      borderRadius: Radius.lg + 4,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: brand.primarySoft,
      boxShadow: "0px 8px 24px rgba(31, 41, 55, 0.08)",
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primarySoft,
    },
    emptyTitle: {
      fontFamily: Fonts.heading,
      fontSize: 18,
      color: Colors.text,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    emptyActions: {
      flexDirection: "row",
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.pill,
      backgroundColor: brand.primary,
      backgroundImage: brand.gradient,
      boxShadow: brand.raisedShadow,
    },
    primaryLabel: {
      fontWeight: "700",
      fontSize: 15,
      color: Colors.textOnPrimary,
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Radius.pill,
      backgroundColor: brand.primarySoft,
    },
    secondaryLabel: {
      fontWeight: "700",
      fontSize: 15,
      color: brand.primary,
    },
  });
