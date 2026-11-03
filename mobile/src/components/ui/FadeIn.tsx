import { useEffect, useState } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

interface FadeInProps {
  /** Décalage en ms : des sections qui apparaissent l'une après l'autre. */
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Apparition douce (fondu + légère montée) au premier affichage. */
export function FadeIn({ delay = 0, style, children }: FadeInProps) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
