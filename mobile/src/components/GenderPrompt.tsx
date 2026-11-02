import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "./ui/Button";
import type { Brand } from "../constants/brands";
import { Colors, Radius, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { AUDIENCE_LABELS, GENDER_EXPLANATION, GENDER_LABELS } from "../lib/audience";
import { getApiErrorMessage } from "../services/api";
import { updateMe } from "../services/user.service";
import type { ActivityAudience, Gender } from "../types/domain";

interface GenderPromptProps {
  /** Public de l'activité concernée (pour le titre). */
  audience: Exclude<ActivityAudience, "ALL">;
  visible: boolean;
  /** Genre enregistré : l'appelant relance son action (rejoindre, publier). */
  onSaved: (gender: Gender) => void;
  onCancel: () => void;
}

/**
 * Demande le genre au moment où il devient nécessaire (activité réservée),
 * jamais avant. Enregistré dans le profil via PATCH /users/me ; modifiable
 * ensuite dans « Modifier mon profil ».
 */
export function GenderPrompt({ audience, visible, onSaved, onCancel }: GenderPromptProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [choice, setChoice] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!choice) return;
    setSaving(true);
    setError(null);
    try {
      await updateMe({ gender: choice });
      onSaved(choice);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'enregistrer. Réessaie."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            Activité « {AUDIENCE_LABELS[audience].toLowerCase()} »
          </Text>
          <Text style={styles.text}>Pour continuer, indique ton genre.</Text>
          <Text style={styles.muted}>{GENDER_EXPLANATION}</Text>

          <View style={styles.options} accessibilityRole="radiogroup">
            {(Object.keys(GENDER_LABELS) as Gender[]).map((gender) => {
              const selected = choice === gender;
              return (
                <Pressable
                  key={gender}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setChoice(gender)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Ionicons
                    name={selected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={selected ? brand.primary : Colors.textMuted}
                  />
                  <Text style={styles.optionLabel}>{GENDER_LABELS[gender]}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}

          <Button label="Enregistrer et continuer" onPress={save} loading={saving} disabled={!choice} />
          <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={saving} />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      padding: Spacing.lg,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    sheet: {
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: Colors.background,
    },
    title: {
      ...Typography.title,
      fontSize: 20,
    },
    text: {
      ...Typography.body,
    },
    muted: {
      ...Typography.caption,
      fontSize: 13,
    },
    options: {
      gap: Spacing.sm,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 48,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    optionSelected: {
      borderColor: brand.primary,
      backgroundColor: brand.primarySoft,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
    },
    error: {
      color: Colors.danger,
      fontSize: 13,
    },
  });
