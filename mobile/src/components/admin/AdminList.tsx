import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "../ui/Text";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Radius, Spacing, Typography } from "../../constants/theme";

/** Champ de recherche des listes admin. */
export function AdminSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

/** Ligne "x au total · y affichés". */
export function ListSummary({ text }: { text: string }) {
  return <Text style={styles.summary}>{text}</Text>;
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: Spacing.sm },
  summary: { ...Typography.caption },
});
