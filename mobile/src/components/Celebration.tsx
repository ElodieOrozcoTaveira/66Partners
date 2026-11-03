import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import type { Brand } from "../constants/brands";
import { Colors, Fonts, Radius, Spacing } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";

interface CelebrationProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const CONFETTI_COUNT = 14;
const CONFETTI_DISTANCE = 110;

/**
 * Moment de réussite (demande envoyée, activité publiée) : coche qui
 * rebondit et confettis aux couleurs du territoire. Sans animation si
 * l'utilisateur a réduit les animations du téléphone.
 */
export function Celebration({ visible, title, message, onClose }: CelebrationProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [pop] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    pop.setValue(0);
    burst.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        setReduceMotion(reduce);
        if (reduce) {
          pop.setValue(1);
          return;
        }
        Animated.parallel([
          Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }),
          Animated.timing(burst, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    return () => {
      cancelled = true;
    };
  }, [visible, pop, burst]);

  const colors = [brand.primary, brand.accent, "#2E7D32", "#1E88E5", brand.primaryDark];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer">
        <Pressable style={styles.sheet} onPress={() => undefined} accessibilityViewIsModal>
          <View style={styles.burst}>
            {!reduceMotion
              ? Array.from({ length: CONFETTI_COUNT }, (_, index) => {
                  const angle = (index / CONFETTI_COUNT) * Math.PI * 2;
                  const distance = CONFETTI_DISTANCE * (index % 2 ? 0.75 : 1);
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.confetti,
                        index % 3 === 0 && styles.confettiLong,
                        {
                          backgroundColor: colors[index % colors.length],
                          opacity: burst.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                          transform: [
                            { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance] }) },
                            { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance] }) },
                            { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${index * 47}deg`] }) },
                          ],
                        },
                      ]}
                    />
                  );
                })
              : null}
            <Animated.View
              style={[
                styles.check,
                {
                  transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
                  opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                },
              ]}
            >
              <Ionicons name="checkmark" size={44} color={Colors.textOnPrimary} />
            </Animated.View>
          </View>

          <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.action}>
            <Button label="Super !" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      padding: Spacing.xl,
      backgroundColor: "rgba(17, 24, 39, 0.5)",
    },
    sheet: {
      alignItems: "center",
      gap: Spacing.sm,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.lg + 8,
      backgroundColor: Colors.background,
    },
    burst: {
      width: 96,
      height: 96,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
    },
    confetti: {
      position: "absolute",
      width: 9,
      height: 9,
      borderRadius: 2,
    },
    confettiLong: {
      width: 5,
      height: 14,
    },
    check: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primary,
      backgroundImage: brand.gradientDiagonal,
      boxShadow: brand.raisedShadow,
    },
    title: {
      fontFamily: Fonts.headingExtraBold,
      fontSize: 22,
      color: Colors.text,
      textAlign: "center",
    },
    message: {
      fontSize: 15,
      lineHeight: 21,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    action: {
      alignSelf: "stretch",
      marginTop: Spacing.md,
    },
  });
