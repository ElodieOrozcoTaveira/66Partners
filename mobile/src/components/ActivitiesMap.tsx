import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import type { LocationStatus } from "../hooks/useUserLocation";
import { formatActivityDay, formatActivityTime } from "../lib/date";
import { DEFAULT_SEARCH_RADIUS_KM, isInRegion, nearbyLabel, regionForRadius, type Coordinates } from "../lib/geo";
import type { NearbyCount } from "../services/nearby.service";
import { toMapPoints } from "../lib/mapPoints";
import { getSportPhoto } from "../lib/sportPhotos";
import { getSportVisual } from "../lib/sportVisuals";
import type { Activity } from "../types/domain";

interface ActivitiesMapProps {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
  /** Position du téléphone (null tant qu'elle n'est pas connue ou si refusée). */
  userLocation?: Coordinates | null;
  locationStatus?: LocationStatus;
  /** Bouton « Me localiser » : demande l'autorisation si besoin, renvoie la position. */
  onLocate?: () => Promise<Coordinates | null>;
  /** Nombre de sportifs dans le rayon (null tant qu'il n'est pas connu). */
  nearby?: NearbyCount | null;
}

/** Hauteur de la fiche d'activité en bas de carte (photo 84 + marges). */
const CARD_HEIGHT = 100;

/**
 * Carte des activités (écran 5 de la maquette) : un marqueur par activité au
 * centre de sa commune, et la fiche de l'activité touchée en bas de l'écran.
 *
 * Avec la position de l'utilisateur : la carte s'ouvre sur un rayon de
 * 15 km autour de lui, s'il se trouve dans le département du territoire
 * affiché (sinon elle reste sur le département, où sont les activités).
 * Le bouton « Me localiser » recentre dans tous les cas.
 */
export function ActivitiesMap({
  activities,
  onOpen,
  userLocation = null,
  locationStatus = "idle",
  onLocate,
  nearby = null,
}: ActivitiesMapProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Le toucher d'un marqueur remonte aussi à la carte (Android : action
  // "marker-press" ; iOS : toucher de carte juste après) : on l'ignore pour ne
  // pas refermer aussitôt la fiche.
  const lastMarkerPress = useRef(0);
  const mapRef = useRef<MapView>(null);
  // Territoire déjà cadré sur l'utilisateur : on ne recadre qu'une fois,
  // pour ne pas contrarier l'utilisateur qui a déplacé la carte.
  const autoCenteredFor = useRef<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Petite notification : glisse depuis le haut quand le nombre arrive ou change.
  const [toast] = useState(() => new Animated.Value(0));
  const nearbyCount = nearby?.count ?? null;
  useEffect(() => {
    if (nearbyCount === null) return;
    toast.setValue(0);
    Animated.spring(toast, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
  }, [nearbyCount, toast]);

  const nearUser = userLocation !== null && isInRegion(userLocation, brand.mapRegion);
  const initialRegion =
    nearUser && userLocation ? regionForRadius(userLocation, DEFAULT_SEARCH_RADIUS_KM) : brand.mapRegion;

  // La position arrive souvent après l'affichage de la carte : on cadre alors.
  useEffect(() => {
    if (!userLocation || autoCenteredFor.current === brand.code) return;
    autoCenteredFor.current = brand.code;
    if (isInRegion(userLocation, brand.mapRegion)) {
      mapRef.current?.animateToRegion(regionForRadius(userLocation, DEFAULT_SEARCH_RADIUS_KM), 600);
    }
  }, [userLocation, brand.code, brand.mapRegion]);

  const recenter = async () => {
    if (!onLocate) return;
    setLocating(true);
    try {
      const position = (await onLocate()) ?? userLocation;
      if (position) {
        mapRef.current?.animateToRegion(regionForRadius(position, DEFAULT_SEARCH_RADIUS_KM), 500);
      }
    } finally {
      setLocating(false);
    }
  };

  const { points, missing } = useMemo(() => toMapPoints(activities), [activities]);
  const selected = points.find((point) => point.item.id === selectedId)?.item ?? null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Pas de zoom automatique sur les activités. Changer de territoire
        // recrée la carte (key).
        key={brand.code}
        initialRegion={initialRegion}
        showsUserLocation={userLocation !== null && locationStatus !== "denied"}
        showsMyLocationButton={false}
        onPress={(event) => {
          if (event.nativeEvent.action === "marker-press") return;
          if (Date.now() - lastMarkerPress.current < 400) return;
          setSelectedId(null);
        }}
        toolbarEnabled={false}
        showsPointsOfInterests={false}
        accessibilityLabel="Carte des activités"
      >
        {userLocation ? (
          <Circle
            center={userLocation}
            radius={DEFAULT_SEARCH_RADIUS_KM * 1000}
            strokeColor={brand.primary}
            strokeWidth={2}
            fillColor={`${brand.primary}14`}
          />
        ) : null}
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

      <View style={styles.topOverlay} pointerEvents="none">
        {userLocation && nearby ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[
              styles.radiusCard,
              {
                opacity: toast,
                transform: [{ translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
              },
            ]}
          >
            <View style={styles.radiusIcon}>
              <Ionicons name="people" size={14} color={Colors.textOnPrimary} />
            </View>
            <Text style={styles.radiusText}>{nearbyLabel(nearby.count, nearby.radiusKm)}</Text>
          </Animated.View>
        ) : null}
        {points.length === 0 ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Aucune activité à afficher sur la carte.</Text>
          </View>
        ) : missing > 0 ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              {missing} activité{missing > 1 ? "s" : ""} sans lieu précis (visible{missing > 1 ? "s" : ""} dans la liste)
            </Text>
          </View>
        ) : null}
      </View>

      {onLocate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Me localiser"
          accessibilityHint={`Centre la carte sur ta position, rayon de ${DEFAULT_SEARCH_RADIUS_KM} km`}
          accessibilityState={{ busy: locating }}
          onPress={recenter}
          disabled={locating}
          style={({ pressed }) => [
            styles.locateButton,
            { bottom: selected ? CARD_HEIGHT + Spacing.md * 2 : Spacing.md },
            pressed && styles.pressed,
          ]}
        >
          {locating ? (
            <ActivityIndicator color={brand.primary} />
          ) : (
            <Ionicons
              name={userLocation ? "locate" : "locate-outline"}
              size={22}
              color={brand.primary}
            />
          )}
        </Pressable>
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
    topOverlay: {
      position: "absolute",
      top: Spacing.md,
      left: Spacing.md,
      right: Spacing.md,
      alignItems: "center",
      gap: Spacing.sm,
    },
    radiusCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingLeft: 6,
      paddingRight: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    radiusIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primary,
    },
    radiusText: {
      ...Typography.caption,
      color: Colors.text,
      fontWeight: "600",
    },
    locateButton: {
      position: "absolute",
      right: Spacing.md,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    banner: {
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
