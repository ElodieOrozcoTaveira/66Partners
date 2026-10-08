console.log("Lgin screen chargé");

import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Champs requis",
        "Renseigne ton email et ton mot de passe."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: email.trim(),
        password,
      });

      // La navigation sera gérée automatiquement
      // par notre protection de routes.
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de te connecter. Vérifie tes identifiants.";

      Alert.alert("Connexion impossible", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>66Partners</Text>

        <Text style={styles.title}>Bienvenue 👋</Text>

        <Text style={styles.subtitle}>
          Connecte-toi pour retrouver tes partenaires sportifs.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Mot de passe</Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Ton mot de passe"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() =>
              Alert.alert(
                "Mot de passe oublié",
                "Cette fonctionnalité sera ajoutée juste après."
              )
            }
          >
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.registerLink}>
              Pas encore de compte ? Créer un compte
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: "#666",
    marginBottom: 32,
  },

  form: {
    gap: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },

  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1f6b45",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  link: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
    fontWeight: "600",
    color: "#1f6b45",
  },

  registerLink: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});