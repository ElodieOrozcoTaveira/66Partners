import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors, Radius, Spacing } from "../constants/theme";
import { getSportVisual } from "../lib/sportVisuals";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import type { Brand } from "../constants/brands";

interface SportBubbleProps {
  sportName: string;
  selected?: boolean;
  onPress: () => void;
  /** "round" : rangée de l'accueil ; "tile" : grille de la recherche. */
  shape?: "round" | "tile";
  /** Icône aux couleurs du sport (comme la carte) au lieu de la couleur du thème. */
  colored?: boolean;
}

/** Pastille de sport de la maquette : icône rouge sur fond rosé + libellé. */
export function SportBubble({
  sportName,
  selected = false,
  onPress,
  shape = "round",
  colored = false,
}: SportBubbleProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { icon, color } = getSportVisual(sportName);
  const isTile = shape === "tile";
  // Couleur du sport : fond teinté (~12 % d'opacité), plein quand il est choisi.
  const accent = colored ? color : brand.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sportName}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        isTile ? styles.tile : styles.round,
        isTile && selected && colored && { borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          isTile ? styles.tileIcon : styles.roundIcon,
          colored && { backgroundColor: `${color}1F` },
          selected && { backgroundColor: accent },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={isTile ? 26 : 24}
          color={selected ? Colors.textOnPrimary : accent}
        />
      </View>
      <Text style={[styles.label, selected && { color: accent }]} numberOfLines={1}>
        {sportName}
      </Text>
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  round: {
    width: 64,
    alignItems: "center",
    gap: Spacing.xs,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pressed: {
    opacity: 0.75,
  },
  roundIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primarySoft,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primarySoft,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
});
