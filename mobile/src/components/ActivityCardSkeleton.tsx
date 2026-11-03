import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";

import { Colors, Radius, Shadow, Spacing } from "../constants/theme";

/**
 * Carte fantôme affichée pendant le chargement d'une liste d'activités :
 * la mise en page apparaît tout de suite (chargement perçu plus court).
 */
export function ActivityCardSkeleton() {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled || reduceMotion) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        );
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });

  return (
    <Animated.View style={[styles.card, { opacity }]} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.photo} />
      <View style={styles.body}>
        <View style={[styles.line, styles.title]} />
        <View style={[styles.line, styles.medium]} />
        <View style={[styles.line, styles.short]} />
        <View style={styles.footer}>
          <View style={styles.avatar} />
          <View style={[styles.line, styles.short]} />
        </View>
      </View>
    </Animated.View>
  );
}

/** Plusieurs cartes fantômes + annonce du chargement pour les lecteurs d'écran. */
export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list} accessible accessibilityLabel="Chargement des activités" accessibilityLiveRegion="polite">
      {Array.from({ length: count }, (_, index) => (
        <ActivityCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg + 2,
    backgroundColor: Colors.background,
    overflow: "hidden",
    ...Shadow.card,
  },
  photo: {
    height: 150,
    backgroundColor: Colors.surface,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.surface,
  },
  title: {
    width: "70%",
    height: 16,
  },
  medium: {
    width: "50%",
  },
  short: {
    width: "35%",
  },
});
