import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInputInstance,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { AuthTabs } from "../../src/components/AuthTabs";
import { GoogleButton } from "../../src/components/GoogleButton";
import { LEGAL_URLS } from "../../src/config/env";
import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { Colors, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { LANDSCAPE_PHOTO } from "../../src/lib/sportPhotos";
import { validateLogin } from "../../src/lib/validation";
import { getApiErrorMessage } from "../../src/services/api";
import { googleAuth, googleComplete, googleLink } from "../../src/services/auth.service";
import {
  GoogleSignInError,
  getGoogleIdToken,
  isGoogleSignInAvailable,
} from "../../src/services/googleSignIn";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import type { Brand } from "../../src/constants/brands";

/**
 * Un même jeton Google peut mener à trois issues (cf. backend
 * AuthService.loginWithGoogle, même logique que le site) : connexion directe,
 * nouveau compte à valider avec les CGU, ou email déjà inscrit à associer
 * après une connexion par mot de passe. Jamais de fusion automatique.
 */
type GoogleFlow =
  | { step: "idle" }
  | { step: "newAccount"; credential: string; email: string }
  | { step: "linkPending"; credential: string; email: string };

export default function LoginScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { login, startSession, sessionExpired } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [google, setGoogle] = useState<GoogleFlow>({ step: "idle" });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleLogin = async () => {
    const validationError = validateLogin(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      // Navigation automatique : la garde du layout racine bascule sur les onglets.
      if (google.step === "linkPending") {
        // Best-effort : la connexion est déjà réussie, un échec d'association
        // ne doit pas bloquer l'accès.
        googleLink(google.credential).catch(() => undefined);
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Impossible de te connecter. Vérifie tes identifiants.")
      );
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    if (!isGoogleSignInAvailable()) {
      // Bouton toujours affiché, mais la connexion exige le module natif
      // (absent d'Expo Go) et les identifiants OAuth (EXPO_PUBLIC_GOOGLE_*).
      setError(
        __DEV__
          ? "Connexion Google indisponible : il faut un development build (pas Expo Go) et EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dans mobile/.env."
          : "La connexion Google n'est pas disponible pour le moment."
      );
      return;
    }
    setIsGoogleLoading(true);
    try {
      const credential = await getGoogleIdToken();
      if (!credential) {
        setIsGoogleLoading(false);
        return; // annulé par l'utilisateur
      }

      const result = await googleAuth(credential);
      if (result.status === "LOGGED_IN") {
        await startSession(result);
        return;
      }
      if (result.status === "NEW_ACCOUNT") {
        setTermsAccepted(false);
        setGoogle({ step: "newAccount", credential, email: result.email });
      } else {
        setEmail(result.email);
        setGoogle({ step: "linkPending", credential, email: result.email });
      }
      setIsGoogleLoading(false);
    } catch (err) {
      setError(
        err instanceof GoogleSignInError
          ? err.message
          : getApiErrorMessage(err, "Connexion avec Google impossible. Réessaie plus tard.")
      );
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (google.step !== "newAccount") return;
    if (!termsAccepted) {
      setError(
        "Tu dois accepter les Mentions légales et la Politique de confidentialité pour créer un compte."
      );
      return;
    }
    setError(null);
    setIsGoogleLoading(true);
    try {
      const response = await googleComplete(google.credential);
      await startSession(response);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de créer le compte avec Google."));
      setIsGoogleLoading(false);
    }
  };

  const cancelGoogle = () => {
    setGoogle({ step: "idle" });
    setError(null);
  };

  return (
    <View style={styles.root}>
      {/* Photo de montagne en arrière-plan, fondue vers le blanc en haut. */}
      <View style={styles.backdrop} pointerEvents="none">
        <Image
          source={LANDSCAPE_PHOTO}
          resizeMode="cover"
          style={styles.backdropImage}
          accessible={false}
        />
        <View style={styles.backdropFade} />
      </View>

    <SafeAreaView style={styles.safe}>
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

          <AuthTabs active="login" />

          {sessionExpired ? (
            <View style={styles.notice} accessibilityLiveRegion="polite">
              <Text style={styles.noticeText}>
                Ta session a expiré. Reconnecte-toi pour continuer.
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              submitBehavior="submit"
            />

            <View>
              <TextField
                ref={passwordRef}
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="Ton mot de passe"
                isPassword
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push("/(auth)/forgot-password")}
                hitSlop={8}
                style={styles.forgot}
              >
                <Text style={styles.forgotLabel}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            {google.step === "linkPending" ? (
              <View style={styles.notice} accessibilityLiveRegion="polite">
                <Text style={styles.noticeText}>
                  Un compte existe déjà avec {google.email}. Connecte-toi avec ton mot de
                  passe : ton compte Google y sera associé.
                </Text>
              </View>
            ) : null}

            {google.step === "newAccount" ? (
              <View style={styles.googleCard}>
                <Text style={styles.googleTitle}>Créer ton compte avec Google</Text>
                <Text style={styles.googleEmail}>{google.email}</Text>

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

                <Button
                  label="Créer mon compte"
                  onPress={handleGoogleSignup}
                  loading={isGoogleLoading}
                />
                <Button label="Annuler" variant="ghost" onPress={cancelGoogle} />
              </View>
            ) : (
              <>
                <Button
                  label="Se connecter"
                  onPress={handleLogin}
                  loading={isSubmitting}
                  disabled={isGoogleLoading}
                />

                {google.step === "idle" ? (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>ou</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    <GoogleButton
                      onPress={handleGoogle}
                      loading={isGoogleLoading}
                      disabled={isSubmitting}
                    />
                  </>
                ) : null}

                {google.step === "linkPending" ? (
                  <Button label="Annuler l’association Google" variant="ghost" onPress={cancelGoogle} />
                ) : null}
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.slogan}>Le sport nous rapproche</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },
  backdropImage: {
    width: "100%",
    height: "100%",
  },
  backdropFade: {
    ...StyleSheet.absoluteFill,
    // Fondu : blanc opaque en haut (sous le formulaire), photo nette en bas.
    backgroundImage:
      "linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.85) 25%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0) 80%)",
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  logo: {
    width: 240,
    height: 136,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  notice: {
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  noticeText: {
    color: Colors.warning,
    fontSize: 14,
  },
  form: {
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  forgot: {
    alignSelf: "flex-end",
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  forgotLabel: {
    color: brand.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
  },
  googleCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  googleTitle: {
    ...Typography.subheading,
  },
  googleEmail: {
    ...Typography.caption,
    fontSize: 14,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
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
  footer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  slogan: {
    ...Typography.heading,
    fontStyle: "italic",
    color: Colors.textOnPrimary,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
