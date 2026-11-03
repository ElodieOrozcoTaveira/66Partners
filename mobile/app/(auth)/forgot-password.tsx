import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { Colors, Spacing, Typography } from "../../src/constants/theme";
import { isValidEmail } from "../../src/lib/validation";
import { forgotPassword } from "../../src/services/auth.service";
import { getApiErrorMessage } from "../../src/services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError("Renseigne une adresse email valide.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'envoyer l'email. Réessaie plus tard."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Mot de passe oublié</Text>

          {sent ? (
            <View style={styles.form}>
              {/* Même message que l'email existe ou non : le backend ne
                  révèle pas quels comptes existent. */}
              <Text style={styles.body} accessibilityLiveRegion="polite">
                Si un compte existe pour {email.trim()}, tu vas recevoir un email avec un lien
                pour choisir un nouveau mot de passe. Le lien s’ouvre sur le site 66Partners ;
                ton nouveau mot de passe fonctionnera ensuite aussi dans l’application.
              </Text>
              <Button label="Retour à la connexion" onPress={() => router.back()} />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.body}>
                Indique l’email de ton compte, nous t’enverrons un lien de réinitialisation.
              </Text>

              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="ton@email.com"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />

              {error ? (
                <Text style={styles.error} accessibilityLiveRegion="polite">
                  {error}
                </Text>
              ) : null}

              <Button label="Envoyer le lien" onPress={handleSubmit} loading={isSubmitting} />
              <Button label="Annuler" variant="ghost" onPress={() => router.back()} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
  },
});
