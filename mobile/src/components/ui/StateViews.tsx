import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, Typography } from "../../constants/theme";
import { Button } from "./Button";
import { useBrand, useBrandStyles } from "../../context/BrandContext";
import type { Brand } from "../../constants/brands";

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={brand.primary} />
      <Text style={styles.message}>{label}</Text>
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={44} color={Colors.textMuted} />
      <Text style={styles.title}>Oups</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button label="Réessayer" variant="secondary" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

interface EmptyStateProps {
  icon?: ComponentProps<typeof Ionicons>["name"];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "search-outline",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={44} color={Colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.subheading,
    textAlign: "center",
  },
  message: {
    ...Typography.caption,
    fontSize: 15,
    textAlign: "center",
  },
  action: {
    marginTop: Spacing.md,
    alignSelf: "stretch",
  },
});
