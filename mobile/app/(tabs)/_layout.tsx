import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../src/constants/theme";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useNotifications } from "../../src/context/NotificationsContext";
import type { Brand } from "../../src/constants/brands";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// RN 0.88 : la tab bar fournit un ColorValue (string, nombre, null…) que le
// typage de @expo/vector-icons n'accepte pas encore. Nos couleurs d'onglets
// sont toujours des chaînes (cf. screenOptions).
function tabIcon(name: IconName, activeName: IconName) {
  return function TabIcon({
    color,
    size,
    focused,
  }: {
    color: unknown;
    size: number;
    focused: boolean;
  }) {
    return (
      <Ionicons
        name={focused ? activeName : name}
        size={size}
        color={typeof color === "string" ? color : undefined}
      />
    );
  };
}

/** Bouton central rond en dégradé (maquette) pour créer une activité. */
function CreateTabIcon() {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.createButton}>
      <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
    </View>
  );
}

export default function TabsLayout() {
  const brand = useBrand();
  const { notifications } = useNotifications();
  // Non-lus de la messagerie : notifications "nouveau message" non lues.
  const unreadMessages = notifications.filter(
    (notification) => notification.type === "NEW_MESSAGE" && !notification.estLu
  ).length;
  const styles = useBrandStyles(makeStyles);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.primary,
        tabBarInactiveTintColor: Colors.text,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        // Sur Android, la barre remonterait au-dessus du clavier : on la masque.
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", tabBarIcon: tabIcon("home-outline", "home") }}
      />
      <Tabs.Screen
        name="explorer"
        options={{ title: "Explorer", tabBarIcon: tabIcon("search-outline", "search") }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Créer",
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: "Créer une activité",
          tabBarIcon: CreateTabIcon,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: tabIcon("chatbox-ellipses-outline", "chatbox-ellipses"),
          tabBarBadge: unreadMessages > 0 ? (unreadMessages > 9 ? "9+" : unreadMessages) : undefined,
          tabBarBadgeStyle: { backgroundColor: brand.primary, color: Colors.textOnPrimary },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profil", tabBarIcon: tabIcon("person-outline", "person") }}
      />
    </Tabs>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  // Barre collée en bas, pleine largeur, fond blanc opaque (façon Instagram).
  // La hauteur et la marge de la zone système sont gérées par Expo Router.
  bar: {
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    elevation: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  createButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primary,
    backgroundImage: brand.gradientDiagonal,
    boxShadow: brand.raisedShadow,
  },
});
