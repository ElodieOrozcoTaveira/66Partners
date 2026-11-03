import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "./ui/Text";
import { Avatar } from "./ui/Avatar";
import { PressableScale } from "./ui/PressableScale";
import { SportIcon } from "./SportIcon";
import { Colors, Fonts, Gradients, Radius, Spacing } from "../constants/theme";
import { calendarDaysFromNow, formatActivityWhen } from "../lib/date";
import { distanceKm, type Coordinates } from "../lib/geo";
import { getSportPhoto } from "../lib/sportPhotos";
import type { Activity } from "../types/domain";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import type { Brand } from "../constants/brands";
import { AUDIENCE_LABELS } from "../lib/audience";

interface ActivityCardProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
  /** Position de l'utilisateur, pour afficher « à 4 km ». */
  from?: Coordinates | null;
}

/** Badge "Aujourd'hui" / "Demain" posé sur la photo (maquette). */
function dayBadge(startDate: Date): string | null {
  const days = calendarDaysFromNow(startDate);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return null;
}

/**
 * Carte d'activité des listes (Explorer, Mes activités) : grande photo, qui
 * organise, quand, où, à quelle distance et combien de places il reste.
 * Toute la carte est cliquable.
 */
function ActivityCardComponent({ activity, onPress, from }: ActivityCardProps) {
  const styles = useBrandStyles(makeStyles);
  const start = new Date(activity.startDate);
  const placesLeft = Math.max(0, activity.maxParticipants - activity.participantsCount);
  const isFull = placesLeft === 0;
  const isCancelled = activity.status === "CANCELLED";
  const badge = dayBadge(start);
  const when = formatActivityWhen(activity.startDate);
  const fill = Math.min(1, activity.participantsCount / Math.max(1, activity.maxParticipants));
  const distance =
    from && activity.latitude !== null && activity.longitude !== null
      ? distanceKm(from, { latitude: activity.latitude, longitude: activity.longitude })
      : null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${activity.sportName}, ${activity.city}, ${when}${
        isFull ? ", complet" : `, ${placesLeft} places restantes`
      }`}
      onPress={() => onPress(activity)}
      style={styles.card}
    >
      <View style={styles.photoWrap}>
        <Image
          source={getSportPhoto(activity.sportName)}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
          transition={150}
        />
        <View style={styles.shade} />

        <View style={styles.photoTop}>
          {badge ? <Text style={styles.badge}>{badge}</Text> : <View />}
          {isCancelled ? (
            <Text style={[styles.pill, styles.pillDanger]}>Annulée</Text>
          ) : distance !== null ? (
            <View style={[styles.pill, styles.pillLight]}>
              <Ionicons name="navigate" size={11} color={Colors.text} />
              <Text style={styles.pillLightText}>{distance < 1 ? "< 1 km" : `${Math.round(distance)} km`}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.photoBottom}>
          {/* Pastille du sport, aux couleurs du sport (comme les épingles de la carte). */}
          <View style={styles.sportBadge}>
            <SportIcon sportName={activity.sportName} size={30} />
          </View>
          <Text style={styles.sportName} numberOfLines={1}>
            {activity.sportName}
          </Text>
          {activity.audience !== "ALL" ? (
            <Text style={styles.audience}>{AUDIENCE_LABELS[activity.audience]}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        <View style={styles.metaRow}>
          <Meta icon="calendar-outline" text={when} />
        </View>
        <View style={styles.metaRow}>
          <Meta icon="location-outline" text={activity.city} />
        </View>

        <View style={styles.footer}>
          <View style={styles.organizer}>
            <Avatar uri={activity.creatorAvatar} name={activity.creatorPseudo} size={24} />
            <Text style={styles.organizerText} numberOfLines={1}>
              {activity.creatorPseudo ? `Par ${activity.creatorPseudo}` : "Organisateur"}
            </Text>
          </View>
          <Text style={[styles.places, isFull && styles.placesFull]}>
            {isFull ? "Complet" : `${placesLeft} place${placesLeft > 1 ? "s" : ""}`}
          </Text>
        </View>
        {/* Jauge de remplissage. */}
        <View style={styles.gauge} accessible={false}>
          <View
            style={[
              styles.gaugeFill,
              { width: `${Math.max(fill, 0.04) * 100}%` },
              isFull && { backgroundColor: Colors.warning, backgroundImage: undefined },
            ]}
          />
        </View>
      </View>
      {isCancelled ? <View style={[StyleSheet.absoluteFill, styles.cancelledVeil]} pointerEvents="none" /> : null}
    </PressableScale>
  );
}

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={brand.primary} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export const ActivityCard = memo(ActivityCardComponent);

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    card: {
      borderRadius: Radius.lg + 2,
      backgroundColor: Colors.background,
      overflow: "hidden",
      boxShadow: "0px 6px 20px rgba(31, 41, 55, 0.10)",
    },
    photoWrap: {
      height: 150,
      justifyContent: "space-between",
    },
    shade: {
      ...StyleSheet.absoluteFill,
      backgroundImage: Gradients.photoShade,
    },
    photoTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      padding: Spacing.sm,
    },
    photoBottom: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.sm,
    },
    sportBadge: {
      borderRadius: 17,
      borderWidth: 2,
      borderColor: Colors.background,
    },
    sportName: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "700",
      color: Colors.textOnPrimary,
    },
    badge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
      borderRadius: Radius.sm,
      overflow: "hidden",
      backgroundColor: brand.accent,
      backgroundImage: brand.badgeGradient,
      fontSize: 12,
      fontWeight: "800",
      color: Colors.text,
    },
    // Public réservé (entre femmes / entre hommes).
    audience: {
      marginLeft: "auto",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      overflow: "hidden",
      fontSize: 12,
      fontWeight: "800",
      color: Colors.textOnPrimary,
      backgroundColor: brand.primary,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      overflow: "hidden",
      fontSize: 12,
      fontWeight: "700",
    },
    pillLight: {
      backgroundColor: "rgba(255, 255, 255, 0.92)",
    },
    pillLightText: {
      fontSize: 11,
      fontWeight: "700",
      color: Colors.text,
    },
    pillDanger: {
      color: Colors.danger,
      backgroundColor: Colors.dangerSoft,
    },
    body: {
      padding: Spacing.md,
      paddingTop: Spacing.md,
      gap: 4,
    },
    title: {
      fontFamily: Fonts.heading,
      fontSize: 17,
      lineHeight: 22,
      color: Colors.text,
      marginBottom: 2,
    },
    metaRow: {
      flexDirection: "row",
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },
    metaText: {
      fontSize: 13,
      color: Colors.textSecondary,
      flexShrink: 1,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    organizer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexShrink: 1,
    },
    organizerText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
      flexShrink: 1,
    },
    places: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.success,
    },
    placesFull: {
      color: Colors.warning,
    },
    gauge: {
      height: 4,
      marginTop: 6,
      borderRadius: 2,
      overflow: "hidden",
      backgroundColor: Colors.surface,
    },
    gaugeFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: brand.primary,
      backgroundImage: brand.gradient,
    },
    cancelledVeil: {
      backgroundColor: "rgba(255, 255, 255, 0.45)",
    },
  });
