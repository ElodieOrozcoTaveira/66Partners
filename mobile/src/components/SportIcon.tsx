import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getSportVisual } from "../lib/sportVisuals";

interface SportIconProps {
  sportName: string;
  size?: number;
}

export function SportIcon({ sportName, size = 44 }: SportIconProps) {
  const visual = getSportVisual(sportName);

  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: visual.color },
      ]}
    >
      <MaterialCommunityIcons name={visual.icon} size={size * 0.55} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
