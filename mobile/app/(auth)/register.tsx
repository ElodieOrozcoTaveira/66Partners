import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";

import { AuthTabs } from "../../src/components/AuthTabs";
import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { LEGAL_URLS } from "../../src/config/env";
import { Colors, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { PASSWORD_MIN_LENGTH, validateRegister } from "../../src/lib/validation";
import { getApiErrorMessage } from "../../src/services/api";
import { getTerritories } from "../../src/services/territory.service";
import type { Territory } from "../../src/types/domain";
import { BrandProvider, useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { getBrand } from "../../src/constants/brands";
import type { Brand } from "../../src/constants/brands";

/**
 * L'écran prend les couleurs du territoire choisi dès la sélection (aperçu
 * du thème 66, 34, 11…), avant même la création du compte.
 */
export default function RegisterScreen() {
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  return (
    <BrandProvider code={previewCode}>
      <RegisterForm onTerritoryChange={setPreviewCode} />
    </BrandProvider>
  );
}

function RegisterForm({ onTerritoryChange }: { onTerritoryChange: (code: string) => void }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { register } = useAuth();

  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [territoryCode, setTerritoryCodeState] = useState("");
  const setTerritoryCode = (code: string) => {
    setTerritoryCodeState(code);
    onTerritoryChange(code);
  };
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [territoriesError, setTerritoriesError] = useState<string | null>(null);
  const [isLoadingTerritories, setIsLoadingTerritories] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTerritories()
      .then((data) => {
        if (cancelled) return;
        setTerritories(data);
        setTerritoriesError(null);
        // Un seul territoire ouvert : sélection automatique.
        if (data.length === 1) {
          setTerritoryCodeState(data[0].code);
          onTerritoryChange(data[0].code);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTerritoriesError(
            getApiErrorMessage(err, "Impossible de récupérer les territoires disponibles.")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTerritories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, onTerritoryChange]);

  const retryTerritories = () => {
    setIsLoadingTerritories(true);
    setReloadKey((key) => key + 1);
  };

  const handleRegister = async () => {
    const validationError = validateRegister({
      pseudo,
      email,
      password,
      city,
      territoryCode,
      termsAccepted,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        pseudo: pseudo.trim(),
        email: email.trim(),
        password,
        city: city.trim() || undefined,
        territoryCode,
        termsAccepted: true,
      });
      // Navigation automatique vers les onglets (garde du layout racine).
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de créer ton compte."));
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image
            source={brand.logo}
            resizeMode="contain"
            style={styles.logo}
            accessibilityRole="image"
            accessibilityLabel="66Partners"
          />

          <AuthTabs active="register" />

          <Text style={styles.subtitle}>Rejoins ta communauté sportive.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Territoire *</Text>

            {isLoadingTerritories ? (
              <View style={styles.territoryLoading}>
                <ActivityIndicator color={brand.primary} />
                <Text style={styles.caption}>Chargement des territoires…</Text>
              </View>
            ) : territoriesError ? (
              <View style={styles.territoryError}>
                <Text style={styles.error}>{territoriesError}</Text>
                <Button label="Réessayer" variant="secondary" onPress={retryTerritories} />
              </View>
            ) : (
              <View style={styles.territories} accessibilityRole="radiogroup">
                {territories.map((territory) => {
                  const selected = territory.code === territoryCode;

                  return (
                    <Pressable
                      key={territory.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${territory.name}, ${territory.brandName}`}
                      onPress={() => setTerritoryCode(territory.code)}
                      style={[styles.territory, selected && styles.territorySelected]}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]} />
                      <Image
                        source={getBrand(territory.code).logo}
                        resizeMode="contain"
                        style={styles.territoryLogo}
                        accessible={false}
                      />
                      <View style={styles.flex}>
                        <Text style={[styles.territoryName, selected && styles.selectedText]}>
                          {territory.name}
                        </Text>
                        <Text style={styles.caption}>{territory.brandName}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <TextField
              label="Pseudo *"
              value={pseudo}
              onChangeText={setPseudo}
              placeholder="Ton pseudo"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              maxLength={100}
            />

            <TextField
              label="Email *"
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <TextField
              label="Mot de passe *"
              value={password}
              onChangeText={setPassword}
              placeholder={`${PASSWORD_MIN_LENGTH} caractères minimum`}
              isPassword
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={128}
            />

            <TextField
              label="Ville"
              value={city}
              onChangeText={setCity}
              placeholder="Ta ville (facultatif)"
              autoComplete="address-line2"
              maxLength={100}
              hint="Visible sur ton profil par les autres membres."
            />

            <View style={styles.termsRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                accessibilityLabel="J'accepte les Mentions légales et la Politique de confidentialité"
                hitSlop={8}
                onPress={() => setTermsAccepted((value) => !value)}
                style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}
              >
                {termsAccepted ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </Pressable>

              <Text style={styles.termsText}>
                J’accepte les{" "}
                <Text
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.legalNotice)}
                >
                  Mentions légales
                </Text>{" "}
                et la{" "}
                <Text
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
                >
                  Politique de confidentialité
                </Text>
                .
              </Text>
            </View>

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Button
              label="Créer mon compte"
              onPress={handleRegister}
              loading={isSubmitting}
              disabled={isLoadingTerritories || Boolean(territoriesError)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  logo: {
    width: 200,
    height: 112,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: -Spacing.sm,
  },
  caption: {
    ...Typography.caption,
  },
  territoryLoading: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  territoryError: {
    gap: Spacing.sm,
  },
  territories: {
    gap: Spacing.sm,
  },
  territory: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  territorySelected: {
    borderColor: brand.primary,
    backgroundColor: brand.primarySoft,
  },
  territoryLogo: {
    width: 64,
    height: 36,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  radioSelected: {
    borderColor: brand.primary,
    backgroundColor: brand.primary,
  },
  territoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  selectedText: {
    color: brand.primary,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: brand.primary,
    backgroundColor: brand.primary,
  },
  termsText: {
    flex: 1,
    ...Typography.caption,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: brand.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
  },
});
