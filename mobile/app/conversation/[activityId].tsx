import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Avatar } from "../../src/components/ui/Avatar";
import { EmptyState, ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useNotifications } from "../../src/context/NotificationsContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { formatActivityTime } from "../../src/lib/date";
import { formatDaySeparator, isSameDay, mergeMessages } from "../../src/lib/chat";
import { getActivity } from "../../src/services/activities.service";
import { getApiErrorCode, getApiErrorMessage } from "../../src/services/api";
import {
  getActivityConversation,
  getMessages,
  MESSAGE_MAX_LENGTH,
  MESSAGES_PAGE_SIZE,
  sendMessage,
} from "../../src/services/messages.service";
import type { ChatMessage } from "../../src/types/domain";
import { haptics } from "../../src/lib/haptics";

// Le serveur ne diffuse pas en direct les messages envoyés par l'API (ni ceux
// du site) : on interroge la dernière page tant que la discussion est ouverte.
const POLL_INTERVAL_MS = 5000;

interface ChatState {
  conversationId: string;
  /** Du plus récent au plus ancien (liste inversée). */
  messages: ChatMessage[];
  hasMore: boolean;
}

export default function ConversationScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const headerHeight = useHeaderHeight();
  const { activityId, title, carpool } = useLocalSearchParams<{
    activityId: string;
    title?: string;
    carpool?: string;
  }>();
  const { user } = useAuth();
  const { activeTerritory, territories, setActiveTerritory } = useTerritory();
  const { notifications, markAsRead } = useNotifications();
  const territory = activeTerritory?.code;

  const [chat, setChat] = useState<ChatState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Chargement : discussion (créée si besoin) puis dernière page de messages.
  useEffect(() => {
    if (!activityId || !territory) return;
    let cancelled = false;

    getActivityConversation(activityId, territory, carpool || undefined)
      .then(async (conversation) => {
        const page = await getMessages(conversation.id, territory);
        if (cancelled) return;
        setChat({
          conversationId: conversation.id,
          messages: page,
          hasMore: page.length === MESSAGES_PAGE_SIZE,
        });
        setLoadError(null);
      })
      .catch(async (err) => {
        if (cancelled) return;
        if (getApiErrorCode(err) !== "WRONG_TERRITORY") {
          setLoadError(getApiErrorMessage(err, "Impossible d'ouvrir cette discussion."));
          return;
        }
        // Discussion d'un autre territoire de l'utilisateur : on bascule
        // directement dessus (l'effet se relance avec le bon territoire),
        // sans l'obliger à passer par son profil.
        const activity = await getActivity(activityId).catch(() => null);
        if (cancelled) return;
        const target = territories.find((item) => item.id === activity?.territoryId);
        if (target && target.code !== territory) {
          setActiveTerritory(target.code);
          return;
        }
        setLoadError("Cette discussion appartient à un territoire que tu n'as pas rejoint.");
      });

    return () => {
      cancelled = true;
    };
  }, [activityId, territory, carpool, reloadKey, territories, setActiveTerritory]);

  const conversationId = chat?.conversationId ?? null;

  // Nouveaux messages : interrogation régulière, écran visible et app au premier plan.
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || !territory) return;
      let active = AppState.currentState === "active";

      const poll = () => {
        if (!active) return;
        getMessages(conversationId, territory)
          .then((page) =>
            setChat((current) =>
              current && current.conversationId === conversationId
                ? { ...current, messages: mergeMessages(current.messages, page) }
                : current
            )
          )
          .catch(() => undefined);
      };

      const interval = setInterval(poll, POLL_INTERVAL_MS);
      const subscription = AppState.addEventListener("change", (state) => {
        active = state === "active";
        if (active) poll();
      });
      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }, [conversationId, territory])
  );

  // Ouvrir la discussion vaut lecture de ses notifications "nouveau message" (comme le web).
  useEffect(() => {
    if (!chat || carpool) return;
    for (const notification of notifications) {
      if (notification.type === "NEW_MESSAGE" && !notification.estLu && notification.activityId === activityId) {
        markAsRead(notification.id);
      }
    }
  }, [chat, carpool, notifications, activityId, markAsRead]);

  const loadOlder = async () => {
    if (!chat || !chat.hasMore || loadingMore || !territory) return;
    setLoadingMore(true);
    try {
      const page = await getMessages(chat.conversationId, territory, chat.messages.length);
      setChat((current) =>
        current
          ? {
              ...current,
              messages: mergeMessages(current.messages, page),
              hasMore: page.length === MESSAGES_PAGE_SIZE,
            }
          : current
      );
    } catch {
      // Nouvel essai au prochain défilement.
    } finally {
      setLoadingMore(false);
    }
  };

  const send = async () => {
    const contenu = draft.trim();
    if (!contenu || !chat || !territory || sending || !user) return;
    setSending(true);
    setSendError(null);
    try {
      const created = await sendMessage(chat.conversationId, contenu, territory);
      haptics.tap();
      setDraft("");
      setChat((current) =>
        current
          ? {
              ...current,
              messages: mergeMessages(current.messages, [
                { ...created, authorPseudo: user.pseudo, authorAvatar: user.avatar },
              ]),
            }
          : current
      );
    } catch (err) {
      setSendError(getApiErrorMessage(err, "Message non envoyé. Réessaie."));
    } finally {
      setSending(false);
    }
  };

  const headerTitle = carpool ? "Covoiturage" : title || "Discussion";

  const screenOptions = (
    <Stack.Screen
      options={{
        title: headerTitle,
        // En-tête opaque : sur iOS 26 il est sinon en « verre » transparent, les
        // messages passent dessous (floutés) et le décalage clavier ci-dessous
        // (headerHeight) cacherait la zone de saisie.
        headerStyle: { backgroundColor: Colors.background },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voir l'activité"
            hitSlop={10}
            onPress={() => router.push({ pathname: "/activity/[id]", params: { id: activityId } })}
          >
            <Ionicons name="information-circle-outline" size={26} color={brand.primary} />
          </Pressable>
        ),
      }}
    />
  );

  if (loadError) {
    return (
      <>
        {screenOptions}
        <ErrorState
          message={loadError}
          onRetry={() => {
            setLoadError(null);
            setReloadKey((key) => key + 1);
          }}
        />
      </>
    );
  }

  if (!chat) {
    return (
      <>
        {screenOptions}
        <LoadingState />
      </>
    );
  }

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {screenOptions}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <FlatList
          inverted
          data={chat.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.older} color={brand.primary} /> : undefined}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="Aucun message"
                message="Lance la conversation : point de rendez-vous, matériel, horaires…"
              />
            </View>
          }
          renderItem={({ item, index }) => {
            // Liste inversée : l'élément suivant dans le tableau est le message précédent.
            const older = chat.messages[index + 1];
            const newer = chat.messages[index - 1];
            return (
              <MessageBubble
                message={item}
                isMine={item.usersId === user?.id}
                showAuthor={!older || older.usersId !== item.usersId || !isSameDay(older.createdAt, item.createdAt)}
                isLastOfGroup={!newer || newer.usersId !== item.usersId}
                daySeparator={!older || !isSameDay(older.createdAt, item.createdAt) ? formatDaySeparator(item.createdAt) : null}
              />
            );
          }}
        />

        {sendError ? (
          <Text style={styles.sendError} accessibilityLiveRegion="assertive">
            {sendError}
          </Text>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setSendError(null);
            }}
            placeholder="Écris un message…"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            maxLength={MESSAGE_MAX_LENGTH}
            accessibilityLabel="Message"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            accessibilityState={{ disabled: !canSend, busy: sending }}
            onPress={send}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendDisabled]}
          >
            {sending ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.textOnPrimary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Fiche profil d'un participant (écran public d'un membre). */
function openProfile(userId: string) {
  router.push({ pathname: "/user/[id]", params: { id: userId } });
}

function MessageBubble({
  message,
  isMine,
  showAuthor,
  isLastOfGroup,
  daySeparator,
}: {
  message: ChatMessage;
  isMine: boolean;
  showAuthor: boolean;
  isLastOfGroup: boolean;
  daySeparator: string | null;
}) {
  const styles = useBrandStyles(makeStyles);
  const time = formatActivityTime(new Date(message.createdAt));

  return (
    <View>
      {daySeparator ? <Text style={styles.day}>{daySeparator}</Text> : null}
      <View style={[styles.messageRow, isMine && styles.messageRowMine, isLastOfGroup && styles.groupEnd]}>
        {!isMine ? (
          <View style={styles.avatarSlot}>
            {isLastOfGroup ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir le profil de ${message.authorPseudo}`}
                hitSlop={8}
                onPress={() => openProfile(message.usersId)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Avatar uri={message.authorAvatar} name={message.authorPseudo} size={30} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={[styles.bubbleColumn, isMine && styles.bubbleColumnMine]}>
          {!isMine && showAuthor ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Voir le profil de ${message.authorPseudo}`}
              hitSlop={6}
              onPress={() => openProfile(message.usersId)}
              style={({ pressed }) => [styles.authorButton, pressed && styles.pressed]}
            >
              <Text style={styles.author}>{message.authorPseudo}</Text>
            </Pressable>
          ) : null}
          <View
            style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
            accessible
            accessibilityLabel={`${isMine ? "Toi" : message.authorPseudo}, ${time} : ${message.contenu}`}
          >
            <Text style={[styles.text, isMine && styles.textMine]} selectable>
              {message.contenu}
            </Text>
            <Text style={[styles.time, isMine && styles.timeMine]}>{time}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    flex: {
      flex: 1,
    },
    list: {
      flexGrow: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    older: {
      paddingVertical: Spacing.md,
    },
    emptyWrap: {
      flex: 1,
      // La liste est inversée : on remet l'état vide à l'endroit.
      transform: [{ scaleY: -1 }],
    },
    day: {
      alignSelf: "center",
      marginVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      overflow: "hidden",
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
      backgroundColor: Colors.surface,
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing.sm,
      marginBottom: 2,
    },
    messageRowMine: {
      justifyContent: "flex-end",
    },
    groupEnd: {
      marginBottom: Spacing.md,
    },
    avatarSlot: {
      width: 30,
    },
    bubbleColumn: {
      maxWidth: "78%",
      gap: 2,
    },
    bubbleColumnMine: {
      alignItems: "flex-end",
    },
    authorButton: {
      alignSelf: "flex-start",
    },
    pressed: {
      opacity: 0.6,
    },
    author: {
      ...Typography.caption,
      fontSize: 12,
      fontWeight: "700",
      marginLeft: Spacing.sm,
    },
    bubble: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.lg,
    },
    bubbleMine: {
      backgroundColor: brand.primary,
      borderBottomRightRadius: 4,
    },
    bubbleOther: {
      backgroundColor: Colors.surface,
      borderBottomLeftRadius: 4,
    },
    text: {
      ...Typography.body,
    },
    textMine: {
      color: Colors.textOnPrimary,
    },
    time: {
      alignSelf: "flex-end",
      marginTop: 2,
      fontSize: 11,
      color: Colors.textSecondary,
    },
    timeMine: {
      color: "rgba(255,255,255,0.8)",
    },
    sendError: {
      color: Colors.danger,
      fontSize: 13,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.background,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      paddingHorizontal: Spacing.md,
      paddingTop: 12,
      paddingBottom: 12,
      borderRadius: 22,
      fontSize: 15,
      color: Colors.text,
      backgroundColor: Colors.surface,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: brand.primary,
      backgroundImage: brand.gradientDiagonal,
    },
    sendDisabled: {
      opacity: 0.4,
    },
  });
