import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Colors, Spacing } from "../constants/theme";
import { useBrandStyles } from "../context/BrandContext";
import type { Brand } from "../constants/brands";

/** Onglets "Connexion / Inscription" en haut des écrans d'authentification. */
export function AuthTabs({ active }: { active: "login" | "register" }) {
  const styles = useBrandStyles(makeStyles);
  const tabs = [
    { key: "login", label: "Connexion", href: "/(auth)/login" },
    { key: "register", label: "Inscription", href: "/(auth)/register" },
  ] as const;

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) router.replace(tab.href);
            }}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: -1,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabSelected: {
    borderBottomColor: brand.primary,
    backgroundColor: brand.primarySoft,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: brand.primary,
    fontWeight: "700",
  },
});
