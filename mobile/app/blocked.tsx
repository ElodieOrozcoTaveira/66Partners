import { useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "../src/components/ui/Text";

import { Avatar } from "../src/components/ui/Avatar";
import { Button } from "../src/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../src/constants/theme";
import { useBrand } from "../src/context/BrandContext";
import { useAsync } from "../src/hooks/useAsync";
import { formatRelativeTime } from "../src/lib/date";
import { getApiErrorMessage } from "../src/services/api";
import { getMyBlocks, unblockUser, type BlockedMember } from "../src/services/moderation.service";

/** Membres bloqués (Paramètres) : on peut les débloquer ici. */
export default function BlockedMembersScreen() {
  const brand = useBrand();
  const [pending, setPending] = useState<string | null>(null);
  const blocks = useAsync(getMyBlocks, [], { errorMessage: "Impossible de charger les membres bloqués." });
  const { setData } = blocks;

  const confirmUnblock = (member: BlockedMember) =>
    Alert.alert(
      `Débloquer ${member.pseudo} ?`,
      "Vous pourrez de nouveau voir vos profils, activités et messages respectifs.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Débloquer",
          onPress: async () => {
            setPending(member.userId);
            try {
              await unblockUser(member.userId);
              setData((current) => current?.filter((item) => item.userId !== member.userId));
            } catch (err) {
              Alert.alert("Action impossible", getApiErrorMessage(err, "Réessaie dans un instant."));
            } finally {
              setPending(null);
            }
          },
        },
      ]
    );

  if (blocks.isLoading) return <LoadingState />;
  if (!blocks.data) return <ErrorState message={blocks.error ?? "Erreur de chargement."} onRetry={blocks.refresh} />;

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={blocks.data}
      keyExtractor={(item) => item.userId}
      refreshControl={<RefreshControl refreshing={blocks.isRefreshing} onRefresh={blocks.refresh} tintColor={brand.primary} />}
      ListHeaderComponent={
        <Text style={styles.caption}>
          Les membres bloqués ne voient plus ton profil, tes activités, tes messages ni tes photos, et inversement. Ils ne
          sont pas informés du blocage.
        </Text>
      }
      ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" title="Aucun membre bloqué" />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar uri={item.avatar} name={item.pseudo} size={44} />
          <View style={styles.rowText}>
            <Text style={styles.pseudo}>{item.pseudo}</Text>
            <Text style={styles.meta}>Bloqué {formatRelativeTime(item.blockedAt)}</Text>
          </View>
          <Button
            label="Débloquer"
            variant="secondary"
            loading={pending === item.userId}
            disabled={pending !== null}
            onPress={() => confirmUnblock(item)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, flexGrow: 1 },
  caption: { ...Typography.caption, fontSize: 14, marginBottom: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowText: { flex: 1, gap: 2 },
  pseudo: { ...Typography.label, fontSize: 15 },
  meta: { ...Typography.caption, fontSize: 12 },
});
