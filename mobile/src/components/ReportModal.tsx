import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput } from "./ui/Text";
import { Ionicons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors, Radius, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { haptics } from "../lib/haptics";
import { getApiErrorMessage } from "../services/api";
import { reportContent, type ReportContext, type ReportReason } from "../services/moderation.service";
import { Button } from "./ui/Button";

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "HARASSMENT", label: "Harcèlement ou insultes", hint: "Propos blessants, menaces, insistance" },
  { value: "INAPPROPRIATE", label: "Contenu inapproprié", hint: "Contenu choquant, sexuel ou violent" },
  { value: "SPAM", label: "Faux profil ou spam", hint: "Usurpation, publicité, arnaque" },
  { value: "DANGEROUS", label: "Comportement dangereux", hint: "Mise en danger lors d'une sortie" },
  { value: "OTHER", label: "Autre", hint: "Précise ci-dessous" },
];

const TITLES: Record<ReportContext, string> = {
  PROFILE: "Signaler ce membre",
  MESSAGE: "Signaler ce message",
  ACTIVITY: "Signaler cette activité",
  PHOTO: "Signaler cette photo",
};

export interface ReportTarget {
  context: ReportContext;
  targetId: string;
}

/**
 * Formulaire de signalement (motif + précisions facultatives). L'équipe est
 * prévenue par email ; le membre signalé n'en est pas informé.
 */
export function ReportModal({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const close = () => {
    setReason(null);
    setDetails("");
    setSending(false);
    onClose();
  };

  const submit = async () => {
    if (!target || !reason) return;
    setSending(true);
    try {
      await reportContent({ ...target, reason, details: details.trim() || undefined });
      haptics.success();
      close();
      Alert.alert("Merci pour ton signalement", "L'équipe 66Partners va l'examiner rapidement. Le membre concerné n'en est pas informé.");
    } catch (err) {
      setSending(false);
      Alert.alert("Envoi impossible", getApiErrorMessage(err, "Ton signalement n'a pas pu être envoyé."));
    }
  };

  return (
    <Modal visible={target !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {target ? TITLES[target.context] : ""}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={close} hitSlop={10}>
            <Ionicons name="close" size={26} color={Colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.caption}>Pourquoi signales-tu ce contenu ?</Text>
          {REPORT_REASONS.map((option) => {
            const selected = option.value === reason;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  haptics.selection();
                  setReason(option.value);
                }}
                style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
              >
                <Ionicons
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={selected ? brand.primary : Colors.textMuted}
                />
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionHint}>{option.hint}</Text>
                </View>
              </Pressable>
            );
          })}
          <Text style={styles.label}>Précisions (facultatif)</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Ce qui s'est passé, quand…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            style={styles.input}
            accessibilityLabel="Précisions"
          />
          <Button label="Envoyer le signalement" loading={sending} disabled={!reason} onPress={() => void submit()} />
          <Text style={styles.footnote}>
            En cas de danger immédiat, contacte le 17 (police) ou le 112.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    title: { ...Typography.heading },
    content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, gap: Spacing.sm },
    caption: { ...Typography.caption, fontSize: 14, marginBottom: Spacing.xs },
    pressed: { opacity: 0.7 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    optionSelected: { borderColor: brand.primary, backgroundColor: brand.primarySoft },
    optionText: { flex: 1, gap: 2 },
    optionLabel: { ...Typography.label },
    optionHint: { ...Typography.caption, fontSize: 12 },
    label: { ...Typography.label, marginTop: Spacing.md },
    input: {
      minHeight: 96,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      fontSize: 15,
      color: Colors.text,
      textAlignVertical: "top",
      marginBottom: Spacing.sm,
    },
    footnote: { ...Typography.caption, fontSize: 12, textAlign: "center", marginTop: Spacing.sm },
  });
