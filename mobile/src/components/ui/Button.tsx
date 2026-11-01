import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Colors, Radius, Spacing, TOUCH_TARGET } from "../../constants/theme";
import { useBrandStyles } from "../../context/BrandContext";
import type { Brand } from "../../constants/brands";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const styles = useBrandStyles(makeStyles);
  // Bloque aussi pendant le chargement : protège contre les doubles soumissions.
  const isDisabled = disabled || loading;
  const palette = useBrandStyles(makeVariants)[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        palette.container,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.spinner} />
      ) : (
        <Text style={[styles.label, palette.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const makeVariants = (brand: Brand) => ({
  primary: {
    // Couleur unie en repli si le dégradé n'est pas rendu (ex. web ancien).
    container: { backgroundColor: brand.primary, backgroundImage: brand.gradient, boxShadow: brand.raisedShadow },
    label: { color: Colors.textOnPrimary },
    spinner: Colors.textOnPrimary,
  },
  secondary: {
    container: {
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: brand.primary,
    },
    label: { color: brand.primary },
    spinner: brand.primary,
  },
  danger: {
    container: {
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.danger,
    },
    label: { color: Colors.danger },
    spinner: Colors.danger,
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    label: { color: brand.primary },
    spinner: brand.primary,
  },
});

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  base: {
    minHeight: TOUCH_TARGET + 4,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
