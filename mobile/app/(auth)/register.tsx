import { router } from "expo-router";

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../src/context/AuthContext";
import {
  getTerritories,
  type Territory,
} from "../../src/services/territory.service";

export default function RegisterScreen() {
  const { register } = useAuth();

  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [territoryCode, setTerritoryCode] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isLoadingTerritories, setIsLoadingTerritories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadTerritories = async () => {
      try {
        const data = await getTerritories();

        setTerritories(data);

        // S'il n'y a qu'un territoire actif, on le sélectionne automatiquement.
        if (data.length === 1) {
          setTerritoryCode(data[0].code);
        }
      } catch (error) {
        console.error("[REGISTER] Territoires:", error);

        Alert.alert(
          "Erreur",
          "Impossible de récupérer les territoires disponibles."
        );
      } finally {
        setIsLoadingTerritories(false);
      }
    };

    loadTerritories();
  }, []);

  const handleRegister = async () => {
    if (!pseudo.trim()) {
      Alert.alert("Champ requis", "Renseigne ton pseudo.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Champ requis", "Renseigne ton email.");
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Mot de passe",
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (!territoryCode) {
      Alert.alert(
        "Territoire",
        "Sélectionne ton territoire."
      );
      return;
    }

    if (!termsAccepted) {
      Alert.alert(
        "Acceptation requise",
        "Tu dois accepter les Mentions Légales et la Politique de confidentialité."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await register({
        pseudo: pseudo.trim(),
        email: email.trim(),
        password,
        city: city.trim() || undefined,
        territoryCode,
        termsAccepted: true,
      });

      // AuthContext reçoit le JWT et l'utilisateur.
      // La navigation vers les onglets sera automatique.
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de créer ton compte.";

      Alert.alert("Inscription impossible", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>66Partners</Text>

        <Text style={styles.title}>Créer ton compte</Text>

        <Text style={styles.subtitle}>
          Rejoins ta communauté sportive.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Pseudo *</Text>

          <TextInput
            style={styles.input}
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Ton pseudo"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email *</Text>

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

          <Text style={styles.label}>Mot de passe *</Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="8 caractères minimum"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <Text style={styles.label}>Ville</Text>

          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Ta ville"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Territoire *</Text>

          {isLoadingTerritories ? (
            <View style={styles.loadingTerritories}>
              <ActivityIndicator />
              <Text style={styles.loadingText}>
                Chargement des territoires...
              </Text>
            </View>
          ) : (
            <View style={styles.territories}>
              {territories.map((territory) => {
                const selected = territory.code === territoryCode;

                return (
                  <Pressable
                    key={territory.id}
                    onPress={() => setTerritoryCode(territory.code)}
                    style={[
                      styles.territory,
                      selected && styles.territorySelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        selected && styles.radioSelected,
                      ]}
                    />

                    <View style={styles.territoryText}>
                      <Text
                        style={[
                          styles.territoryName,
                          selected && styles.territoryNameSelected,
                        ]}
                      >
                        {territory.name}
                      </Text>

                      <Text style={styles.territoryBrand}>
                        {territory.brandName} · {territory.code}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={() => setTermsAccepted((value) => !value)}
            style={styles.termsRow}
          >
            <View
              style={[
                styles.checkbox,
                termsAccepted && styles.checkboxSelected,
              ]}
            >
              {termsAccepted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>

            <Text style={styles.termsText}>
              J'accepte les Mentions Légales et la Politique de
              confidentialité.
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              (!termsAccepted ||
                isSubmitting ||
                isLoadingTerritories) &&
                styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={
              !termsAccepted ||
              isSubmitting ||
              isLoadingTerritories
            }
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Créer mon compte
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 28,
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
    marginBottom: 28,
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

  loadingTerritories: {
    height: 70,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#666",
  },

  territories: {
    gap: 10,
  },

  territory: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },

  territorySelected: {
    borderColor: "#2E7D32",
    backgroundColor: "#F1F8F2",
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#aaa",
    marginRight: 12,
  },

  radioSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "#2E7D32",
  },

  territoryText: {
    flex: 1,
  },

  territoryName: {
    fontSize: 16,
    fontWeight: "600",
  },

  territoryNameSelected: {
    color: "#2E7D32",
  },

  territoryBrand: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    gap: 10,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "#2E7D32",
  },

  checkmark: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#555",
  },

  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});