import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../src/components/ui/Text";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../src/components/ui/Button";
import { LEGAL_URLS } from "../src/config/env";
import { Colors, Radius, Spacing, TOUCH_TARGET, Typography } from "../src/constants/theme";
import { useAuth } from "../src/context/AuthContext";
import { getApiErrorMessage } from "../src/services/api";
import { useBrand, useBrandStyles } from "../src/context/BrandContext";
import type { Brand } from "../src/constants/brands";

export default function SettingsScreen() {
  const styles = useBrandStyles(makeStyles);
  const { user, logout, deleteAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const performDeletion = async () => {
    setIsDeleting(true);
    try {
      // En cas de succès la session est fermée : la garde du layout racine
      // renvoie vers la connexion, cet écran est démonté.
      await deleteAccount();
      Alert.alert(
        "Compte supprimé",
        "Ton compte et tes données personnelles ont été supprimés. Un email de confirmation t'a été envoyé."
      );
    } catch (err) {
      setIsDeleting(false);
      Alert.alert(
        "Suppression impossible",
        getApiErrorMessage(err, "La suppression n'a pas pu aboutir. Réessaie plus tard.")
      );
    }
  };

  const confirmLogout = () => {
    Alert.alert("Déconnexion", "Veux-tu vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => void logout() },
    ]);
  };

  // Double confirmation : action définitive et irréversible.
  const confirmDeletion = () => {
    Alert.alert(
      "Supprimer ton compte ?",
      "Seront définitivement supprimés : ton profil, tes photos, tes sports, tes disponibilités, tes demandes de participation, tes messages et tes notifications.\n\nLes activités que tu as créées resteront visibles pour leurs participants, sans ton nom.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Dernière confirmation",
              `Le compte ${user?.email ?? ""} sera supprimé immédiatement. Cette action est irréversible.`,
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer définitivement",
                  style: "destructive",
                  onPress: () => void performDeletion(),
                },
              ]
            ),
        },
      ]
    );
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Group title="Compte">
        <Row icon="mail-outline" label="Email" value={user?.email} />
        <Row icon="person-circle-outline" label="Modifier mon profil" onPress={() => router.push("/profile/edit")} />
        <Row icon="location-outline" label="Mon territoire" onPress={() => router.push("/territory")} />
        <Row icon="heart-outline" label="Mes sports et disponibilités" onPress={() => router.push("/profile/sports")} />
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push("/notifications")} />
      </Group>

      <Group title="Informations">
        <Row
          icon="shield-checkmark-outline"
          label="Politique de confidentialité"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
        />
        <Row
          icon="document-text-outline"
          label="Mentions légales et conditions"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.legalNotice)}
        />
        <Row
          icon="help-circle-outline"
          label="FAQ"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.faq)}
        />
        <Row
          icon="chatbox-ellipses-outline"
          label="Contact et assistance"
          onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.contact)}
        />
      </Group>

      <View style={styles.actions}>
        <Button label="Se déconnecter" variant="secondary" onPress={confirmLogout} />
      </View>

      <Group title="Zone sensible">
        <Text style={styles.caption}>
          La suppression de ton compte est immédiate et définitive.
        </Text>
        <Button
          label="Supprimer mon compte"
          variant="danger"
          loading={isDeleting}
          onPress={confirmDeletion}
        />
      </Group>

      <Text style={styles.version}>
        66Partners · version {Constants.expoConfig?.version ?? "?"}
      </Text>
    </ScrollView>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string | null;
  onPress?: () => void;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const content = (
    <>
      <Ionicons name={icon} size={20} color={brand.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Ionicons name="open-outline" size={18} color={Colors.textMuted} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  group: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    ...Typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  groupBody: {
    gap: Spacing.sm,
  },
  row: {
    minHeight: TOUCH_TARGET + 4,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  rowLabel: {
    ...Typography.body,
    flex: 1,
  },
  rowValue: {
    ...Typography.caption,
    maxWidth: "55%",
  },
  actions: {
    marginBottom: Spacing.xl,
  },
  caption: {
    ...Typography.caption,
    fontSize: 14,
  },
  version: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
