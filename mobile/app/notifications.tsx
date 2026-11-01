import { useCallback, useState, type ComponentProps } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState, LoadingState } from "../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../src/constants/theme";
import { useBrand, useBrandStyles } from "../src/context/BrandContext";
import { useNotifications } from "../src/context/NotificationsContext";
import { formatRelativeTime } from "../src/lib/date";
import type { AppNotification } from "../src/services/notifications.service";
import type { Brand } from "../src/constants/brands";

type IconName = ComponentProps<typeof Ionicons>["name"];

function iconFor(type: string): IconName {
  switch (type) {
    case "NEW_MESSAGE":
      return "chatbubble-ellipses";
    case "PARTICIPATION_ACCEPTED":
      return "checkmark-circle";
    case "PARTICIPATION_REQUESTED":
      return "person-add";
    case "CARPOOL_REQUESTED":
      return "car";
    default:
      return "notifications";
  }
}

export default function NotificationsScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { notifications, unreadCount, isLoading, refresh, markAsRead, markAllAsRead } =
    useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  // Même destination que sur le site : messages pour NEW_MESSAGE, sinon l'activité.
  const open = (notification: AppNotification) => {
    if (!notification.estLu) markAsRead(notification.id);
    if (notification.type === "NEW_MESSAGE") {
      router.push("/(tabs)/messages");
    } else if (notification.activityId) {
      router.push({ pathname: "/activity/[id]", params: { id: notification.activityId } });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight:
            unreadCount > 0
              ? () => (
                  <Pressable
                    accessibilityRole="button"
                    onPress={markAllAsRead}
                    hitSlop={8}
                  >
                    <Text style={styles.markAll}>Tout lire</Text>
                  </Pressable>
                )
              : undefined,
        }}
      />

      {isLoading && notifications.length === 0 ? (
        <LoadingState />
      ) : (
        <FlatList
          // iOS : l'en-tête est translucide, la liste doit démarrer sous lui.
          contentInsetAdjustmentBehavior="automatic"
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={brand.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Aucune notification"
              message="Tu n'as pas encore de notification."
            />
          }
          renderItem={({ item }) => {
            const unread = !item.estLu;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${unread ? "Non lue. " : ""}${item.contenu ?? "Notification"}`}
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.item,
                  unread && styles.itemUnread,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.icon}>
                  <Ionicons name={iconFor(item.type)} size={20} color={brand.primary} />
                </View>
                <View style={styles.body}>
                  <Text style={[styles.text, unread && styles.textUnread]}>
                    {item.contenu ?? "Nouvelle notification"}
                  </Text>
                  <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
                </View>
                {unread ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          }}
        />
      )}
    </>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    list: {
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    emptyContainer: {
      flexGrow: 1,
    },
    markAll: {
      color: brand.primary,
      fontWeight: "700",
      fontSize: 15,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    itemUnread: {
      backgroundColor: brand.primarySoft,
      borderColor: brand.primarySoft,
    },
    pressed: {
      opacity: 0.7,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
      gap: 2,
    },
    text: {
      ...Typography.body,
    },
    textUnread: {
      fontWeight: "700",
    },
    time: {
      ...Typography.caption,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: brand.primary,
    },
  });
