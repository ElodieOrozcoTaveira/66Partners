import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Avatar } from "../../src/components/ui/Avatar";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useNotifications } from "../../src/context/NotificationsContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { formatConversationTime } from "../../src/lib/chat";
import { getSportPhoto } from "../../src/lib/sportPhotos";
import { getMyConversations } from "../../src/services/messages.service";
import type { ConversationSummary } from "../../src/types/domain";

/** Ignore accents et casse. */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function conversationKey(item: ConversationSummary): string {
  return item.isCarpool ? `carpool:${item.activityId}:${item.carpoolWithUserId}` : `group:${item.activityId}`;
}

/** Discussions des activités créées ou rejointes, sur le territoire actif. */
export default function MessagesScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { activeTerritory } = useTerritory();
  const { notifications } = useNotifications();
  const territoryCode = activeTerritory?.code;
  const [query, setQuery] = useState("");

  const list = useAsync(() => getMyConversations(territoryCode!), [territoryCode], {
    enabled: Boolean(territoryCode),
    errorMessage: "Impossible de charger tes discussions.",
  });
  const { refresh } = list;

  // Retour sur l'onglet (ex. après une discussion) : derniers messages à jour.
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) refresh();
      hasFocused.current = true;
    }, [refresh])
  );

  // Non-lus : notifications "nouveau message" non lues, par activité (comme le web).
  const unreadByActivity = useMemo(() => {
    const counts = new Map<string, number>();
    for (const notification of notifications) {
      if (notification.type === "NEW_MESSAGE" && !notification.estLu && notification.activityId) {
        counts.set(notification.activityId, (counts.get(notification.activityId) ?? 0) + 1);
      }
    }
    return counts;
  }, [notifications]);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return (list.data ?? []).filter(
      (item) =>
        !needle ||
        normalize(`${item.activityTitle} ${item.sportName} ${item.carpoolWithPseudo ?? ""}`).includes(needle)
    );
  }, [list.data, query]);

  const open = (item: ConversationSummary) =>
    router.push({
      pathname: "/conversation/[activityId]",
      params: {
        activityId: item.activityId,
        title: item.activityTitle,
        ...(item.isCarpool && item.carpoolWithUserId ? { carpool: item.carpoolWithUserId } : {}),
      },
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Messages
        </Text>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une conversation…"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Rechercher une conversation"
            autoCorrect={false}
          />
        </View>
      </View>

      {list.isLoading || !territoryCode ? (
        <LoadingState />
      ) : list.error && !list.data ? (
        <ErrorState message={list.error} onRetry={list.refresh} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={conversationKey}
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={brand.primary} />
          }
          renderItem={({ item }) => (
            <ConversationRow item={item} unread={item.isCarpool ? 0 : unreadByActivity.get(item.activityId) ?? 0} onPress={() => open(item)} />
          )}
          ListEmptyComponent={
            query ? (
              <EmptyState icon="search-outline" title="Aucune conversation trouvée" message="Essaie un autre mot." />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title="Aucune discussion pour l’instant"
                message="Une discussion s’ouvre pour chaque activité que tu organises ou rejoins (une fois ta demande acceptée)."
                actionLabel="Trouver une activité"
                onAction={() => router.push("/(tabs)/explorer")}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function ConversationRow({
  item,
  unread,
  onPress,
}: {
  item: ConversationSummary;
  unread: number;
  onPress: () => void;
}) {
  const styles = useBrandStyles(makeStyles);
  const { user } = useAuth();
  const title = item.isCarpool
    ? `Covoiturage · ${item.carpoolWithPseudo ?? "un participant"}`
    : item.activityTitle;
  const preview = item.lastMessage
    ? `${item.lastMessage.authorId === user?.id ? "Toi : " : ""}${item.lastMessage.contenu}`
    : "Aucun message pour l’instant";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${preview}${unread ? `. ${unread} non lu${unread > 1 ? "s" : ""}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {item.isCarpool ? (
        <Avatar uri={item.carpoolWithAvatar} name={item.carpoolWithPseudo} size={52} />
      ) : (
        <Image source={getSportPhoto(item.sportName)} contentFit="cover" style={styles.photo} accessible={false} />
      )}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, unread > 0 && styles.bold]} numberOfLines={1}>
            {title}
          </Text>
          {item.lastMessage ? (
            <Text style={[styles.time, unread > 0 && styles.timeUnread]}>
              {formatConversationTime(item.lastMessage.createdAt)}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowTop}>
          <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
            {item.isCarpool ? `${item.activityTitle} · ` : ""}
            {preview}
          </Text>
          {unread > 0 ? <Text style={styles.badge}>{unread > 9 ? "9+" : unread}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      gap: Spacing.md,
    },
    title: {
      ...Typography.title,
      fontSize: 26,
    },
    search: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 46,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: Colors.surface,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
      paddingVertical: Spacing.sm,
    },
    list: {
      flexGrow: 1,
      paddingBottom: Spacing.xxl,
    },
    pressed: {
      backgroundColor: Colors.surface,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },
    photo: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    rowBody: {
      flex: 1,
      gap: 3,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    rowTitle: {
      ...Typography.subheading,
      fontSize: 15,
      flex: 1,
    },
    bold: {
      fontWeight: "800",
    },
    time: {
      ...Typography.caption,
      fontSize: 12,
    },
    timeUnread: {
      color: brand.primary,
      fontWeight: "700",
    },
    preview: {
      ...Typography.caption,
      fontSize: 14,
      flex: 1,
    },
    previewUnread: {
      color: Colors.text,
      fontWeight: "600",
    },
    badge: {
      minWidth: 22,
      height: 22,
      lineHeight: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      overflow: "hidden",
      textAlign: "center",
      fontSize: 12,
      fontWeight: "800",
      color: Colors.textOnPrimary,
      backgroundColor: brand.primary,
    },
  });
