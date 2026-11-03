import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AdminLogoutButton, CloseAdminButton } from "../../../src/components/admin/AdminHeaderButtons";
import { Colors, Spacing } from "../../../src/constants/theme";
import { useBrand } from "../../../src/context/BrandContext";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName, activeName: IconName) {
  return function TabIcon({ color, size, focused }: { color: unknown; size: number; focused: boolean }) {
    return (
      <Ionicons
        name={focused ? activeName : name}
        size={size}
        color={typeof color === "string" ? color : undefined}
      />
    );
  };
}

/** Mêmes onglets que la barre du bas de l'admin web. */
export default function AdminTabsLayout() {
  const brand = useBrand();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { color: Colors.text },
        headerLeft: () => <CloseAdminButton />,
        headerRight: () => <AdminLogoutButton />,
        headerLeftContainerStyle: styles.headerSide,
        headerRightContainerStyle: styles.headerSide,
        tabBarActiveTintColor: brand.primary,
        tabBarInactiveTintColor: Colors.text,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: Colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Statistiques", tabBarIcon: tabIcon("stats-chart-outline", "stats-chart") }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: "Utilisateurs", tabBarIcon: tabIcon("people-outline", "people") }}
      />
      <Tabs.Screen
        name="activities"
        options={{ title: "Activités", tabBarIcon: tabIcon("calendar-outline", "calendar") }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "Signalements", tabBarIcon: tabIcon("flag-outline", "flag") }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerSide: { paddingHorizontal: Spacing.md },
  bar: {
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    elevation: 0,
  },
  label: { fontSize: 11, fontWeight: "600" },
});
