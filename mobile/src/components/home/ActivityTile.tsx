import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "../ui/Text";
import { PressableScale } from "../ui/PressableScale";
import { SportIcon } from "../SportIcon";
import type { Brand } from "../../constants/brands";
import { Colors, Fonts, Radius, Spacing } from "../../constants/theme";
import { useBrand, useBrandStyles } from "../../context/BrandContext";
import { formatActivityWhen } from "../../lib/date";
import { distanceKm, type Coordinates } from "../../lib/geo";
import { getSportPhoto } from "../../lib/sportPhotos";
import type { Activity } from "../../types/domain";

export const ACTIVITY_TILE_WIDTH = 248;

interface ActivityTileProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
  /** Position de l'utilisateur, pour afficher « à 4 km ». */
  from?: Coordinates | null;
}

/** Vignette compacte d'activité pour les carrousels de l'accueil. */
function ActivityTileComponent({ activity, onPress, from }: ActivityTileProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const when = formatActivityWhen(activity.startDate);
  const placesLeft = Math.max(0, activity.maxParticipants - activity.participantsCount);
  const distance =
    from && activity.latitude !== null && activity.longitude !== null
      ? distanceKm(from, { latitude: activity.latitude, longitude: activity.longitude })
      : null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${activity.sportName}, ${activity.city}, ${when}`}
      onPress={() => onPress(activity)}
      style={styles.tile}
    >
      <View style={styles.photoWrap}>
        <Image
          source={getSportPhoto(activity.sportName)}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
          transition={150}
        />
        <View style={styles.sport}>
          <SportIcon sportName={activity.sportName} size={30} />
        </View>
        {distance !== null ? (
          <View style={styles.distance}>
            <Ionicons name="navigate" size={11} color={Colors.text} />
            <Text style={styles.distanceText}>
              {distance < 1 ? "< 1 km" : `${Math.round(distance)} km`}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.when} numberOfLines={1}>
          {when}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {activity.title}
        </Text>
        <View style={styles.footer}>
          <View style={styles.city}>
            <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.cityText} numberOfLines={1}>
              {activity.city}
            </Text>
          </View>
          <Text style={[styles.places, placesLeft === 0 && styles.full]}>
            {placesLeft === 0 ? "Complet" : `${placesLeft} place${placesLeft > 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>
      {activity.audience !== "ALL" ? <View style={[styles.audienceDot, { backgroundColor: brand.primary }]} /> : null}
    </PressableScale>
  );
}

export const ActivityTile = memo(ActivityTileComponent);

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    tile: {
      width: ACTIVITY_TILE_WIDTH,
      borderRadius: Radius.lg,
      backgroundColor: Colors.background,
      boxShadow: "0px 6px 18px rgba(31, 41, 55, 0.10)",
    },
    photoWrap: {
      height: 120,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      overflow: "hidden",
    },
    sport: {
      position: "absolute",
      left: Spacing.sm,
      bottom: Spacing.sm,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: Colors.background,
    },
    distance: {
      position: "absolute",
      top: Spacing.sm,
      right: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      backgroundColor: "rgba(255,255,255,0.92)",
    },
    distanceText: {
      fontSize: 11,
      fontWeight: "700",
      color: Colors.text,
    },
    body: {
      padding: Spacing.md,
      gap: 3,
    },
    when: {
      fontSize: 12,
      fontWeight: "700",
      color: brand.primary,
    },
    title: {
      fontFamily: Fonts.heading,
      fontSize: 15,
      lineHeight: 20,
      minHeight: 40,
      color: Colors.text,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      marginTop: 2,
    },
    city: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      flexShrink: 1,
    },
    cityText: {
      fontSize: 12,
      color: Colors.textSecondary,
      flexShrink: 1,
    },
    places: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.success,
    },
    full: {
      color: Colors.warning,
    },
    audienceDot: {
      position: "absolute",
      top: Spacing.sm,
      left: Spacing.sm,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: Colors.background,
    },
  });
