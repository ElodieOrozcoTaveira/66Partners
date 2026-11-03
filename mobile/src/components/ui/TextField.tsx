import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";
import { Text, TextInput } from "./Text";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Radius, Spacing, Typography } from "../../constants/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Affiche un bouton œil pour révéler le mot de passe. */
  isPassword?: boolean;
  hint?: string;
}

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(function TextField(
  { label, isPassword = false, hint, style, ...inputProps },
  ref
) {
  const [isHidden, setIsHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && isHidden}
          style={[styles.input, style]}
          {...inputProps}
        />

        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isHidden ? "Afficher le mot de passe" : "Masquer le mot de passe"}
            hitSlop={8}
            onPress={() => setIsHidden((value) => !value)}
            style={styles.eye}
          >
            <Ionicons
              name={isHidden ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={Colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs + 2,
  },
  label: {
    ...Typography.label,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
  },
  eye: {
    paddingHorizontal: Spacing.md,
  },
  hint: {
    ...Typography.caption,
  },
});
