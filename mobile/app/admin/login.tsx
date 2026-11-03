import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useAdmin } from "../../src/context/AdminContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { haptics } from "../../src/lib/haptics";
import { requestAdminPasswordReset } from "../../src/services/admin.service";
import { getApiErrorMessage } from "../../src/services/api";

const ERRORS = {
  invalid: "Mot de passe incorrect.",
  rate_limited: "Trop de tentatives. Réessaie dans quelques minutes.",
  network: "Connexion au serveur impossible. Vérifie ta connexion internet.",
} as const;

export default function AdminLoginScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!password) {
      setError("Saisis le mot de passe admin.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await login(password);
    // Succès : la garde du layout admin ouvre les statistiques.
    if (!result.success) {
      haptics.warning();
      setError(ERRORS[result.reason]);
      setIsSubmitting(false);
    } else {
      setPassword("");
    }
  };

  const forgot = () => {
    Alert.alert(
      "Mot de passe oublié",
      "Un lien de réinitialisation sera envoyé à l'adresse email de secours de l'administrateur.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          onPress: () =>
            requestAdminPasswordReset()
              .then(() => Alert.alert("Email envoyé", "Ouvre le lien reçu pour choisir un nouveau mot de passe."))
              .catch((err) =>
                Alert.alert("Envoi impossible", getApiErrorMessage(err, "Réessaie dans quelques minutes."))
              ),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* En-tête iOS transparent : "automatic" décale le contenu sous la barre. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.icon}>
          <Ionicons name="shield-checkmark" size={34} color={brand.primary} />
        </View>
        <Text style={styles.title}>Accès administrateur</Text>
        <Text style={styles.caption}>
          Statistiques, comptes et activités de toute l’application. Le mot de passe est le même que sur le site web.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Mot de passe admin"
            isPassword
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <Button label="Ouvrir l'espace admin" loading={isSubmitting} onPress={() => void submit()} />
          <Pressable accessibilityRole="button" onPress={forgot} hitSlop={8} style={styles.forgot}>
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl, gap: Spacing.md, alignItems: "stretch" },
    icon: {
      alignSelf: "center",
      width: 72,
      height: 72,
      borderRadius: Radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primarySoft,
      marginTop: Spacing.lg,
    },
    title: { ...Typography.heading, textAlign: "center" },
    caption: { ...Typography.caption, fontSize: 14, textAlign: "center" },
    form: { gap: Spacing.md, marginTop: Spacing.lg },
    error: { color: Colors.danger, fontSize: 14, fontWeight: "600" },
    forgot: { alignSelf: "center", paddingVertical: Spacing.sm },
    link: { color: brand.primary, fontWeight: "600", fontSize: 14 },
  });
