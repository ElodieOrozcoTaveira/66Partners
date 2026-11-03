import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AdminSearch, ListSummary } from "../../../src/components/admin/AdminList";
import { ChipRow, TerritoryFilter } from "../../../src/components/admin/AdminUI";
import { Avatar } from "../../../src/components/ui/Avatar";
import { EmptyState, ErrorState, LoadingState } from "../../../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../../../src/constants/theme";
import { useAdmin } from "../../../src/context/AdminContext";
import { useBrand } from "../../../src/context/BrandContext";
import { useAsync } from "../../../src/hooks/useAsync";
import { PROVIDER_LABELS, formatDate, normalizeSearch } from "../../../src/lib/adminLabels";
import { fetchAdminUsers, type AdminUserListItem } from "../../../src/services/admin.service";

type SortKey = "recent" | "oldest" | "organizers" | "participants" | "pseudo";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "organizers", label: "Plus d'activités" },
  { value: "participants", label: "Plus de participations" },
  { value: "pseudo", label: "A → Z" },
];

export default function AdminUsersScreen() {
  const brand = useBrand();
  const { territory, isAdmin, dataVersion } = useAdmin();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const users = useAsync(() => fetchAdminUsers(territory || undefined), [territory, dataVersion], {
    enabled: isAdmin,
    errorMessage: "Impossible de charger les utilisateurs.",
  });

  const visible = useMemo(() => {
    const list = users.data ?? [];
    const needle = normalizeSearch(query.trim());
    const filtered = needle
      ? list.filter((user) => normalizeSearch(`${user.pseudo} ${user.email ?? ""} ${user.city ?? ""}`).includes(needle))
      : list;
    const sorted = [...filtered];
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "organizers":
        sorted.sort((a, b) => b.activitiesCreated - a.activitiesCreated);
        break;
      case "participants":
        sorted.sort((a, b) => b.participations - a.participations);
        break;
      case "pseudo":
        sorted.sort((a, b) => a.pseudo.localeCompare(b.pseudo, "fr"));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [users.data, query, sort]);

  const total = users.data?.length ?? 0;

  const header = (
    <View style={styles.header}>
      <TerritoryFilter />
      <AdminSearch value={query} onChange={setQuery} placeholder="Pseudo, email ou ville" />
      <ChipRow options={SORT_OPTIONS} value={sort} onChange={setSort} />
      {users.data ? (
        <ListSummary
          text={`${total} compte${total > 1 ? "s" : ""}${query ? ` · ${visible.length} affiché${visible.length > 1 ? "s" : ""}` : ""}`}
        />
      ) : null}
    </View>
  );

  if (users.isLoading) return <LoadingState />;
  if (!users.data) return <ErrorState message={users.error ?? "Erreur de chargement."} onRetry={users.refresh} />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(user) => user.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={users.isRefreshing} onRefresh={users.refresh} tintColor={brand.primary} />}
      ListEmptyComponent={
        <EmptyState
          icon="people-outline"
          title={query ? "Aucun résultat" : "Aucun compte"}
          message={query ? "Aucun compte ne correspond à ta recherche." : "Aucun utilisateur inscrit pour l'instant."}
        />
      }
      renderItem={({ item }) => <UserRow user={item} />}
    />
  );
}

function UserRow({ user }: { user: AdminUserListItem }) {
  // Champs absents si le serveur n'a pas encore la dernière version de l'API admin.
  const providers = (user.providers ?? []).map((p) => PROVIDER_LABELS[p] ?? p).join(", ");
  const territories = user.territories ?? [];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fiche de ${user.pseudo}`}
      onPress={() => router.push({ pathname: "/admin/user/[id]", params: { id: user.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar uri={user.avatar} name={user.pseudo} size={46} />
      <View style={styles.rowText}>
        <Text style={styles.pseudo} numberOfLines={1}>
          {user.pseudo}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {user.email}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          Inscrit le {formatDate(user.createdAt)}
          {user.city ? ` · ${user.city}` : ""}
          {territories.length ? ` · ${territories.join(", ")}` : ""}
        </Text>
        <View style={styles.counts}>
          <Count icon="calendar-outline" value={user.activitiesCreated ?? 0} label="créées" />
          <Count icon="person-add-outline" value={user.participations ?? 0} label="participations" />
          {providers ? <Text style={styles.provider}>{providers}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

function Count({ icon, value, label }: { icon: React.ComponentProps<typeof Ionicons>["name"]; value: number; label: string }) {
  return (
    <View style={styles.count}>
      <Ionicons name={icon} size={13} color={Colors.textSecondary} />
      <Text style={styles.countText}>
        {value} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  header: { gap: Spacing.md, marginBottom: Spacing.sm },
  pressed: { opacity: 0.7 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowText: { flex: 1, gap: 2 },
  pseudo: { ...Typography.subheading, fontSize: 15 },
  meta: { ...Typography.caption, fontSize: 12, lineHeight: 16 },
  counts: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.sm, marginTop: 2 },
  count: { flexDirection: "row", alignItems: "center", gap: 3 },
  countText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  provider: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
});
