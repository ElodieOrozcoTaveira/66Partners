import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { formatActivityDay, formatActivityTime } from "../lib/date";
import { toMapPoints } from "../lib/mapPoints";
import { getSportPhoto } from "../lib/sportPhotos";
import { getSportVisual } from "../lib/sportVisuals";
import type { Activity } from "../types/domain";

interface ActivitiesMapProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
}

/**
 * Carte des activités (écran 5 de la maquette) : un marqueur par activité au
 * centre de sa commune, et la fiche de l'activité touchée en bas de l'écran.
 * Aucune localisation de l'utilisateur n'est demandée.
 */
export function ActivitiesMap({ activities, onOpen }: ActivitiesMapProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Le toucher d'un marqueur remonte aussi à la carte (Android : action
  // "marker-press" ; iOS : toucher de carte juste après) : on l'ignore pour ne
  // pas refermer aussitôt la fiche.
  const lastMarkerPress = useRef(0);

  const { points, missing } = useMemo(() => toMapPoints(activities), [activities]);
  const selected = points.find((point) => point.item.id === selectedId)?.item ?? null;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        // Vue fixe sur le département du territoire : pas de zoom automatique
        // sur les activités. Changer de territoire recrée la carte (key).
        key={brand.code}
        initialRegion={brand.mapRegion}
        onPress={(event) => {
          if (event.nativeEvent.action === "marker-press") return;
          if (Date.now() - lastMarkerPress.current < 400) return;
          setSelectedId(null);
        }}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
        accessibilityLabel="Carte des activités"
      >
        {points.map(({ item, coordinate }) => {
          const isSelected = item.id === selectedId;
          return (
            <Marker
              key={item.id}
              coordinate={coordinate}
              onPress={(event) => {
                event.stopPropagation();
                lastMarkerPress.current = Date.now();
                // 1er toucher : fiche en bas ; 2e toucher sur le même marqueur : détail.
                if (isSelected) onOpen(item);
                else setSelectedId(item.id);
              }}
              accessibilityLabel={`${item.sportName}, ${item.title}`}
            >
              {/* Couleur propre au sport (la même que dans "Mes sports"). */}
              <View
                style={[
                  styles.pin,
                  { backgroundColor: getSportVisual(item.sportName).color },
                  isSelected && styles.pinSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={getSportVisual(item.sportName).icon}
                  size={18}
                  color={Colors.textOnPrimary}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {points.length === 0 ? (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>Aucune activité à afficher sur la carte.</Text>
        </View>
      ) : missing > 0 ? (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>
            {missing} activité{missing > 1 ? "s" : ""} sans lieu précis (visible{missing > 1 ? "s" : ""} dans la liste)
          </Text>
        </View>
      ) : null}

      {selected ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir ${selected.title}`}
          onPress={() => onOpen(selected)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <Image source={getSportPhoto(selected.sportName)} contentFit="cover" style={styles.photo} accessible={false} />
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {selected.sportName} · {selected.title}
            </Text>
            <CardRow icon="location-outline" text={selected.city} />
            <CardRow
              icon="calendar-outline"
              text={`${formatActivityDay(new Date(selected.startDate))} · ${formatActivityTime(new Date(selected.startDate))}`}
            />
            <CardRow
              icon="people-outline"
              text={`${selected.participantsCount}/${selected.maxParticipants} participants`}
            />
          </View>
          <Ionicons name="chevron-forward" size={20} color={brand.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function CardRow({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.cardRow}>
      <Ionicons name={icon} size={14} color={brand.primary} />
      <Text style={styles.cardText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
    },
    pressed: {
      opacity: 0.85,
    },
    pin: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: Colors.background,
      backgroundColor: brand.primary,
      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
    },
    pinSelected: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 3,
      // Le marqueur choisi garde la couleur de son sport, en plus grand.
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.4)",
    },
    banner: {
      position: "absolute",
      top: Spacing.md,
      alignSelf: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.pill,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    bannerText: {
      ...Typography.caption,
      color: Colors.text,
    },
    card: {
      position: "absolute",
      left: Spacing.md,
      right: Spacing.md,
      bottom: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.sm,
      paddingRight: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    photo: {
      width: 84,
      height: 84,
      borderRadius: Radius.md,
    },
    cardBody: {
      flex: 1,
      gap: 3,
    },
    cardTitle: {
      ...Typography.subheading,
      fontSize: 15,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cardText: {
      ...Typography.caption,
      flexShrink: 1,
    },
  });
