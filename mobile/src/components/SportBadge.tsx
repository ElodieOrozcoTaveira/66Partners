import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../constants/theme";
import { getSportVisual } from "../lib/sportVisuals";

interface SportBadgeProps {
  /** Nom du sport (clé de sportVisuals). */
  name: string;
  /** Diamètre de la pastille. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pastille d'un sport, identique aux pins de la carte Explorer : rond plein
 * de la couleur du sport, icône blanche, contour blanc et légère ombre.
 */
export function SportBadge({ name, size = 36, style }: SportBadgeProps) {
  const visual = getSportVisual(name);
  return (
    <View
      accessible={false}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: visual.color,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name={visual.icon} size={Math.round(size / 2)} color={Colors.textOnPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
  },
});
