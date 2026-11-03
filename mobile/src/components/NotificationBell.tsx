import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./ui/Text";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Radius, TOUCH_TARGET } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { useNotifications } from "../context/NotificationsContext";
import type { Brand } from "../constants/brands";

/**
 * Cloche de l'en-tête d'accueil, avec le nombre de notifications non lues.
 * `onColor` : version claire, posée sur le dégradé du territoire.
 */
export function NotificationBell({ onColor = false }: { onColor?: boolean }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : "Notifications"
      }
      hitSlop={6}
      onPress={() => router.push("/notifications")}
      style={({ pressed }) => [styles.button, onColor && styles.buttonOnColor, pressed && styles.pressed]}
    >
      <Ionicons
        name={unreadCount > 0 ? "notifications" : "notifications-outline"}
        size={24}
        color={onColor ? Colors.textOnPrimary : brand.primary}
      />
      {unreadCount > 0 ? (
        <View style={styles.badge} accessible={false}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    button: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      borderRadius: Radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primarySoft,
    },
    buttonOnColor: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    pressed: {
      opacity: 0.7,
    },
    badge: {
      position: "absolute",
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: brand.primary,
      borderWidth: 2,
      borderColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: Colors.textOnPrimary,
      fontSize: 10,
      fontWeight: "800",
    },
  });
