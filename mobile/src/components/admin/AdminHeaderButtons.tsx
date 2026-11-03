import { Alert, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing } from "../../constants/theme";
import { useAdmin } from "../../context/AdminContext";

/** Revient à l'application (la session admin reste ouverte). */
export function CloseAdminButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Revenir à l'application"
      hitSlop={10}
      onPress={() => router.dismissTo("/settings")}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="close" size={26} color={Colors.text} />
    </Pressable>
  );
}

/** Ferme la session admin sur ce téléphone (le mot de passe sera redemandé). */
export function AdminLogoutButton() {
  const { logout } = useAdmin();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Se déconnecter de l'espace admin"
      hitSlop={10}
      onPress={() =>
        Alert.alert("Quitter l'espace admin", "Le mot de passe admin sera redemandé à la prochaine ouverture.", [
          { text: "Annuler", style: "cancel" },
          { text: "Se déconnecter", style: "destructive", onPress: () => void logout() },
        ])
      }
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="log-out-outline" size={24} color={Colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: Spacing.xs },
  pressed: { opacity: 0.6 },
});
