import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import { AdminLogoutButton, CloseAdminButton } from "../../../src/components/admin/AdminHeaderButtons";
import { MAIN_LOGO_GRADIENT, MAIN_LOGO_YELLOW, MainLogo } from "../../../src/components/MainLogo";
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
    <>
    {/* Heure et batterie en blanc sur l'en-tête rouge. */}
    <StatusBar style="light" />
    <Tabs
      screenOptions={{
        headerShown: true,
        // En-tête aux couleurs du logo principal : dégradé orange → rouge,
        // liseré jaune, textes et boutons blancs.
        headerBackground: () => <View style={styles.headerBackground} />,
        headerTintColor: Colors.textOnPrimary,
        headerTitleStyle: { color: Colors.textOnPrimary },
        headerLeft: () => <CloseAdminButton color={Colors.textOnPrimary} />,
        headerRight: () => <AdminLogoutButton color={Colors.textOnPrimary} />,
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
        options={{
          title: "Statistiques",
          headerTitle: () => <MainLogo width={92} bare />,
          tabBarIcon: tabIcon("stats-chart-outline", "stats-chart"),
        }}
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
    </>
  );
}

const styles = StyleSheet.create({
  headerSide: { paddingHorizontal: Spacing.md },
  headerBackground: {
    flex: 1,
    backgroundColor: "#D9381E",
    backgroundImage: MAIN_LOGO_GRADIENT,
    borderBottomWidth: 3,
    borderBottomColor: MAIN_LOGO_YELLOW,
  },
  bar: {
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    elevation: 0,
  },
  label: { fontSize: 11, fontWeight: "600" },
});
