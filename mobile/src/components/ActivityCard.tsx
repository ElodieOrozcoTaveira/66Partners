import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { calendarDaysFromNow, formatActivityDay, formatActivityTime } from "../lib/date";
import { getSportPhoto } from "../lib/sportPhotos";
import { SportIcon } from "./SportIcon";
import type { Activity } from "../types/domain";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import type { Brand } from "../constants/brands";

interface ActivityCardProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
}

/** Badge "Aujourd'hui" / "Demain" posé sur la photo (maquette). */
function dayBadge(startDate: Date): string | null {
  const days = calendarDaysFromNow(startDate);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return null;
}

function ActivityCardComponent({ activity, onPress }: ActivityCardProps) {
  const styles = useBrandStyles(makeStyles);
  const start = new Date(activity.startDate);
  const isFull = activity.participantsCount >= activity.maxParticipants;
  const isCancelled = activity.status === "CANCELLED";
  const badge = dayBadge(start);
  const when = `${formatActivityDay(start)} · ${formatActivityTime(start)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${activity.sportName}, ${activity.city}, ${when}`}
      onPress={() => onPress(activity)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.photoWrap}>
        <Image
          source={getSportPhoto(activity.sportName)}
          contentFit="cover"
          style={styles.photo}
          accessible={false}
          transition={150}
        />
        {/* Pastille du sport, aux couleurs du sport (comme les épingles de la carte). */}
        <View style={styles.sportBadge}>
          <SportIcon sportName={activity.sportName} size={34} />
        </View>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        {isCancelled ? (
          <Text style={[styles.status, styles.statusDanger]}>Annulée</Text>
        ) : isFull ? (
          <Text style={[styles.status, styles.statusWarning]}>Complet</Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {activity.sportName} · {activity.title}
          </Text>
          <Meta icon="location-outline" text={activity.city} />
          <Meta icon="calendar-outline" text={when} />
          <Meta
            icon="people-outline"
            text={`${activity.participantsCount}/${activity.maxParticipants} participants`}
          />
        </View>

        <View style={styles.cta} accessible={false}>
          <Text style={styles.ctaLabel}>Voir</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={brand.primary} />
      <Text style={styles.meta} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export const ActivityCard = memo(ActivityCardComponent);

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    overflow: "hidden",
    ...Shadow.card,
  },
  pressed: {
    opacity: 0.9,
  },
  photoWrap: {
    height: 110,
  },
  photo: {
    ...StyleSheet.absoluteFill,
  },
  sportBadge: {
    position: "absolute",
    left: Spacing.sm,
    bottom: Spacing.sm,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.background,
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
  },
  badge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
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
  status: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  statusWarning: {
    color: Colors.warning,
    backgroundColor: Colors.warningSoft,
  },
  statusDanger: {
    color: Colors.danger,
    backgroundColor: Colors.dangerSoft,
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...Typography.subheading,
    fontSize: 15,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    ...Typography.caption,
    flexShrink: 1,
  },
  cta: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: brand.primary,
    backgroundImage: brand.gradient,
  },
  ctaLabel: {
    color: Colors.textOnPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
});
