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
}

/** Pastille de sport de la maquette : icône rouge sur fond rosé + libellé. */
export function SportBubble({ sportName, selected = false, onPress, shape = "round" }: SportBubbleProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { icon } = getSportVisual(sportName);
  const isTile = shape === "tile";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sportName}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [isTile ? styles.tile : styles.round, pressed && styles.pressed]}
    >
      <View
        style={[
          isTile ? styles.tileIcon : styles.roundIcon,
          selected && styles.iconSelected,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={isTile ? 26 : 24}
          color={selected ? Colors.textOnPrimary : brand.primary}
        />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
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
  iconSelected: {
    backgroundColor: brand.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  labelSelected: {
    color: brand.primary,
  },
});
