import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useHeaderHeight } from "expo-router/react-navigation";
import { router } from "expo-router";

import { AvatarEditor } from "../../src/components/AvatarEditor";
import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { Colors, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import {
  CITY_MAX_LENGTH,
  PROFILE_LINE_MAX_LENGTH,
  PSEUDO_MAX_LENGTH,
} from "../../src/lib/validation";
import { getApiErrorMessage } from "../../src/services/api";
import { updateMe } from "../../src/services/user.service";

/** Champ texte facultatif : vide => null (effacement côté serveur). */
function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function EditProfileScreen() {
  const { user, setUser } = useAuth();
  const headerHeight = useHeaderHeight();

  const [pseudo, setPseudo] = useState(user?.pseudo ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [headline, setHeadline] = useState(user?.headline ?? "");
  const [lookingFor, setLookingFor] = useState(user?.lookingFor ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!pseudo.trim()) {
      setError("Ton pseudo ne peut pas être vide.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const updated = await updateMe({
        pseudo: pseudo.trim(),
        city: optional(city),
        headline: optional(headline),
        lookingFor: optional(lookingFor),
      });
      setUser(updated);
      router.back();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'enregistrer ton profil."));
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const changed =
      pseudo !== (user?.pseudo ?? "") ||
      city !== (user?.city ?? "") ||
      headline !== (user?.headline ?? "") ||
      lookingFor !== (user?.lookingFor ?? "");

    if (!changed) {
      router.back();
      return;
    }

    Alert.alert("Abandonner les modifications ?", undefined, [
      { text: "Continuer l'édition", style: "cancel" },
      { text: "Abandonner", style: "destructive", onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      {/* "automatic" : le contenu démarre sous l'en-tête (translucide sur iOS)
          au lieu de passer derrière — sinon le champ Pseudo était masqué. */}
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.avatar}>
          <AvatarEditor size={104} />
          <Text style={styles.avatarHint}>Touche la photo pour la changer</Text>
        </View>
        <TextField
          label="Pseudo *"
          value={pseudo}
          onChangeText={setPseudo}
          autoCapitalize="none"
          maxLength={PSEUDO_MAX_LENGTH}
        />
        <TextField
          label="Ville"
          value={city}
          onChangeText={setCity}
          maxLength={CITY_MAX_LENGTH}
          hint="Visible par les autres membres."
        />
        <TextField
          label="En une phrase"
          value={headline}
          onChangeText={setHeadline}
          placeholder="Ex. Coureuse du dimanche, fan de trail"
          maxLength={PROFILE_LINE_MAX_LENGTH}
        />
        <TextField
          label="Je recherche"
          value={lookingFor}
          onChangeText={setLookingFor}
          placeholder="Ex. Un partenaire de padel le soir"
          maxLength={PROFILE_LINE_MAX_LENGTH}
        />

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Button label="Enregistrer" onPress={handleSave} loading={isSaving} />
        <Button label="Annuler" variant="ghost" onPress={handleCancel} disabled={isSaving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  avatar: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarHint: {
    ...Typography.caption,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
  },
});
