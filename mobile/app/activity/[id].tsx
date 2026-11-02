import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Platform, Share } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Avatar } from "../../src/components/ui/Avatar";
import { Button } from "../../src/components/ui/Button";
import { ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { formatActivityWhen } from "../../src/lib/date";
import { getSportPhoto } from "../../src/lib/sportPhotos";
import {
  ACTIVITY_STATUS_LABELS,
  LEVEL_LABELS,
  PARTICIPATION_STATUS_LABELS,
} from "../../src/lib/labels";
import {
  acceptParticipation,
  cancelParticipation,
  deleteActivity,
  getActivity,
  getMyParticipation,
  getParticipations,
  joinActivity,
  refuseParticipation,
  updateActivity,
} from "../../src/services/activities.service";
import { getApiErrorCode, getApiErrorMessage } from "../../src/services/api";
import { getMyProfile } from "../../src/services/user.service";
import { GenderPrompt } from "../../src/components/GenderPrompt";
import { AUDIENCE_LABELS, AUDIENCE_RESERVED_LABELS, canJoinAudience } from "../../src/lib/audience";
import { WEB_ORIGIN } from "../../src/config/env";
import { haptics } from "../../src/lib/haptics";
import type { Activity, Gender, Participation, ParticipationWithUser } from "../../src/types/domain";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import type { Brand } from "../../src/constants/brands";

interface ActivityDetail {
  activity: Activity;
  myParticipation: Participation | null;
  /** null quand l'utilisateur n'a pas le droit de voir la liste (403 serveur). */
  participants: ParticipationWithUser[] | null;
  /** Instant du chargement : référence pour savoir si l'activité est passée. */
  loadedAt: number;
  /** Mon genre déclaré, chargé seulement pour une activité réservée dont je ne
   *  suis pas l'organisateur (undefined sinon : le serveur tranchera). */
  myGender?: Gender | null;
}

async function loadDetail(id: string, userId: string): Promise<ActivityDetail> {
  const activity = await getActivity(id);
  const isCreator = activity.creatorId === userId;
  const myParticipation = isCreator ? null : await getMyParticipation(id);

  // La liste n'est accessible qu'au créateur et aux participants acceptés :
  // on ne la demande pas sinon (le serveur répondrait 403).
  const canSeeParticipants = isCreator || myParticipation?.status === "ACCEPTED";
  const participants = canSeeParticipants ? await getParticipations(id) : null;

  // Activité réservée : on vérifie tôt si je peux demander à participer,
  // pour afficher « Réservée aux femmes » plutôt qu'un bouton voué à l'échec.
  const myGender =
    activity.audience !== "ALL" && !isCreator && !myParticipation
      ? await getMyProfile()
          .then((me) => me.gender ?? null)
          .catch(() => undefined)
      : undefined;

  return { activity, myParticipation, participants, loadedAt: Date.now(), myGender };
}

export default function ActivityDetailScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [genderPromptVisible, setGenderPromptVisible] = useState(false);

  const detail = useAsync(() => loadDetail(id, userId), [id, userId], {
    enabled: Boolean(id && userId),
    errorMessage: "Impossible de charger cette activité.",
  });
  const { refresh } = detail;

  // Activité d'un autre de mes territoires (ex. ouverte depuis une
  // notification) : on bascule sur ce territoire, pour que l'écran et les
  // actions (accepter un participant…) soient aux couleurs de l'activité.
  const { territories, activeTerritory, setActiveTerritory } = useTerritory();
  const activityTerritoryId = detail.data?.activity.territoryId;
  useEffect(() => {
    if (!activityTerritoryId || activeTerritory?.id === activityTerritoryId) return;
    const target = territories.find((territory) => territory.id === activityTerritoryId);
    if (target) setActiveTerritory(target.code);
  }, [activityTerritoryId, activeTerritory?.id, territories, setActiveTerritory]);

  // Retour sur l'écran (ex. après modification) : données rechargées.
  const hasFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) refresh();
      hasFocused.current = true;
    }, [refresh])
  );

  const runAction = useCallback(
    async (key: string, action: () => Promise<unknown>, failure: string) => {
      setPendingAction(key);
      try {
        await action();
        haptics.success();
        refresh();
      } catch (err) {
        haptics.warning();
        Alert.alert("Action impossible", getApiErrorMessage(err, failure));
      } finally {
        setPendingAction(null);
      }
    },
    [refresh]
  );

  // Demande de participation. Activité réservée sans genre renseigné : le
  // serveur répond GENDER_REQUIRED, on le demande puis on relance.
  const requestToJoin = async (activityId: string) => {
    setPendingAction("join");
    try {
      await joinActivity(activityId);
      haptics.success();
      refresh();
    } catch (err) {
      if (getApiErrorCode(err) === "GENDER_REQUIRED") {
        setGenderPromptVisible(true);
      } else {
        haptics.warning();
        Alert.alert("Action impossible", getApiErrorMessage(err, "Impossible d'envoyer ta demande."));
        // AUDIENCE_RESTRICTED : le profil a pu changer, on recharge l'écran.
        refresh();
      }
    } finally {
      setPendingAction(null);
    }
  };

  if (detail.isLoading) return <LoadingState />;
  if (!detail.data) {
    return (
      <ErrorState
        message={detail.error ?? "Impossible de charger cette activité."}
        onRetry={detail.refresh}
      />
    );
  }

  const { activity, myParticipation, participants, loadedAt } = detail.data;
  const isCreator = activity.creatorId === userId;
  const isPast = new Date(activity.startDate).getTime() <= loadedAt;
  const isClosed = activity.status === "CANCELLED" || activity.status === "COMPLETED" || isPast;
  const isFull = activity.participantsCount >= activity.maxParticipants;
  const placesLeft = Math.max(activity.maxParticipants - activity.participantsCount, 0);

  const confirmCancelParticipation = (participation: Participation) => {
    const isAccepted = participation.status === "ACCEPTED";
    Alert.alert(
      isAccepted ? "Se désinscrire ?" : "Annuler ta demande ?",
      isAccepted
        ? "Ta place sera libérée pour un autre sportif."
        : "L’organisateur ne verra plus ta demande.",
      [
        { text: "Retour", style: "cancel" },
        {
          text: isAccepted ? "Me désinscrire" : "Annuler la demande",
          style: "destructive",
          onPress: () =>
            runAction(
              "cancel",
              () => cancelParticipation(participation.id),
              "Impossible d'annuler ta participation."
            ),
        },
      ]
    );
  };

  // Partage natif : lien vers la page de l'activité sur le site.
  const shareActivity = async () => {
    const url = `${WEB_ORIGIN}/activities/${activity.id}`;
    const when = formatActivityWhen(activity.startDate);
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message: `${activity.title} · ${activity.city} · ${when}`, url }
          : { message: `${activity.title} · ${activity.city} · ${when}\n${url}` },
        { subject: activity.title }
      );
    } catch {
      // Partage annulé ou indisponible : rien à signaler.
    }
  };

  const confirmCancelActivity = () => {
    Alert.alert(
      "Annuler l’activité ?",
      "Elle restera visible avec le statut « Annulée » pour que les participants soient au courant. Tu pourras ensuite la supprimer.",
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Annuler l’activité",
          style: "destructive",
          onPress: () =>
            runAction(
              "cancelActivity",
              () => updateActivity(activity.id, { status: "CANCELLED" }),
              "Impossible d'annuler l'activité."
            ),
        },
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      "Supprimer définitivement ?",
      "L’activité, ses demandes de participation, sa discussion et ses photos seront supprimées. Cette action est irréversible.",
      [
        { text: "Retour", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setPendingAction("delete");
            try {
              await deleteActivity(activity.id);
              router.back();
            } catch (err) {
              Alert.alert("Action impossible", getApiErrorMessage(err, "Impossible de supprimer l'activité."));
              setPendingAction(null);
            }
          },
        },
      ]
    );
  };

  // Profil public d'un membre ; le sien renvoie sur « Mon profil ».
  const openProfile = (memberId: string) => {
    if (memberId === userId) router.push("/(tabs)/profile");
    else router.push({ pathname: "/user/[id]", params: { id: memberId } });
  };

  const pendingRequests = participants?.filter((p) => p.status === "PENDING") ?? [];
  const accepted = participants?.filter((p) => p.status === "ACCEPTED") ?? [];

  const statusLabel = isPast && activity.status === "PENDING" ? "Passée" : ACTIVITY_STATUS_LABELS[activity.status];
  const statusTone =
    activity.status === "CANCELLED" ? styles.toneDanger : isClosed ? styles.toneNeutral : styles.toneSuccess;

  // Action principale, fixée en bas de l'écran comme sur la maquette.
  let footer: React.ReactNode = null;
  if (!isCreator) {
    if (myParticipation) {
      footer = (
        <>
          <Text
            style={[
              styles.participationStatus,
              myParticipation.status === "ACCEPTED" && styles.toneSuccess,
              myParticipation.status === "REFUSED" && styles.toneDanger,
            ]}
            accessibilityLiveRegion="polite"
          >
            {PARTICIPATION_STATUS_LABELS[myParticipation.status]}
          </Text>
          {myParticipation.status !== "REFUSED" && !isPast ? (
            <Button
              label={myParticipation.status === "ACCEPTED" ? "Me désinscrire" : "Annuler ma demande"}
              variant="danger"
              loading={pendingAction === "cancel"}
              disabled={pendingAction !== null}
              onPress={() => confirmCancelParticipation(myParticipation)}
            />
          ) : null}
        </>
      );
    } else if (isClosed) {
      footer = <Text style={styles.caption}>Cette activité n’accepte plus de demandes.</Text>;
    } else if (isFull) {
      footer = <Text style={styles.caption}>Cette activité est complète.</Text>;
    } else if (activity.audience !== "ALL" && !canJoinAudience(activity.audience, detail.data.myGender)) {
      footer = (
        <View style={styles.reserved} accessible accessibilityRole="text">
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.caption}>{AUDIENCE_RESERVED_LABELS[activity.audience]}</Text>
        </View>
      );
    } else {
      footer = (
        <Button
          label="Rejoindre l’activité"
          accessibilityHint="Envoie une demande à l’organisateur, qui pourra l’accepter."
          loading={pendingAction === "join"}
          disabled={pendingAction !== null}
          onPress={() => requestToJoin(activity.id)}
        />
      );
    }
  } else if (activity.status === "CANCELLED") {
    footer = (
      <Button
        label="Supprimer définitivement"
        variant="danger"
        loading={pendingAction === "delete"}
        disabled={pendingAction !== null}
        onPress={() => confirmDelete()}
      />
    );
  } else if (!isClosed) {
    footer = (
      <View style={styles.organizerActions}>
        <Button
          label="Modifier"
          variant="secondary"
          disabled={pendingAction !== null}
          onPress={() => router.push({ pathname: "/activity/edit/[id]", params: { id: activity.id } })}
          style={styles.flex}
        />
        <Button
          label="Annuler l’activité"
          variant="danger"
          loading={pendingAction === "cancelActivity"}
          disabled={pendingAction !== null}
          onPress={() => confirmCancelActivity()}
          style={styles.flex}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false, title: activity.sportName }} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefreshing}
            onRefresh={detail.refresh}
            tintColor={Colors.textOnPrimary}
          />
        }
      >
        <View style={styles.hero}>
          <Image
            source={getSportPhoto(activity.sportName)}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            accessible={false}
          />
          <View style={[styles.heroShade, StyleSheet.absoluteFill]} />
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title} accessibilityRole="header">
            {activity.title}
          </Text>

          <View style={styles.infoList}>
            <InfoRow icon="location-outline" text={activity.city} />
            <InfoRow icon="calendar-outline" text={formatActivityWhen(activity.startDate)} />
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={18} color={brand.primary} />
              <Text style={styles.body}>
                {activity.participantsCount}/{activity.maxParticipants} participants
                {!isClosed && !isFull
                  ? ` · ${placesLeft} place${placesLeft > 1 ? "s" : ""}`
                  : ""}
              </Text>
              <Text style={[styles.statusChip, statusTone]}>
                {isFull && !isClosed ? "Complète" : statusLabel}
              </Text>
            </View>
          </View>

          {activity.description ? (
            <Text style={[styles.body, styles.description]}>{activity.description}</Text>
          ) : null}

          <View style={styles.tags}>
            <Text style={styles.tag}>{activity.sportName}</Text>
            <Text style={styles.tag}>Niveau {LEVEL_LABELS[activity.levelRequired].toLowerCase()}</Text>
            {activity.carpoolEnabled ? <Text style={styles.tag}>Covoiturage</Text> : null}
            {activity.audience !== "ALL" ? (
              <Text style={[styles.tag, styles.tagAudience]}>{AUDIENCE_LABELS[activity.audience]}</Text>
            ) : null}
          </View>

          <Section title="Organisateur">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                activity.creatorPseudo ? `Voir le profil de ${activity.creatorPseudo}` : "Compte supprimé"
              }
              // Compte supprimé : plus de profil à ouvrir.
              disabled={!activity.creatorId}
              onPress={() => activity.creatorId && openProfile(activity.creatorId)}
              style={({ pressed }) => [styles.organizer, pressed && styles.personPressed]}
            >
              <Avatar uri={activity.creatorAvatar} name={activity.creatorPseudo} size={48} />
              <Text style={[styles.personName, styles.flex]}>
                {activity.creatorPseudo ?? "Compte supprimé"}
                {isCreator ? " (toi)" : ""}
              </Text>
              {activity.creatorId ? (
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              ) : null}
            </Pressable>
          </Section>

          {/* Discussion de groupe : organisateur et participants acceptés (règle serveur). */}
          {isCreator || myParticipation?.status === "ACCEPTED" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/conversation/[activityId]",
                  params: { activityId: activity.id, title: activity.title },
                })
              }
              style={({ pressed }) => [styles.chatLink, pressed && styles.chatLinkPressed]}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={Colors.textOnPrimary} />
              <Text style={styles.chatLinkLabel}>Discussion du groupe</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textOnPrimary} />
            </Pressable>
          ) : null}

          {/* Organisateur : demandes à traiter */}
          {isCreator && pendingRequests.length > 0 ? (
            <Section title={`Demandes en attente (${pendingRequests.length})`}>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Voir le profil de ${request.userPseudo}`}
                    onPress={() => openProfile(request.userId)}
                    style={({ pressed }) => [styles.personRow, pressed && styles.personPressed]}
                  >
                    <Avatar uri={request.userAvatar} name={request.userPseudo} size={40} />
                    <Text style={[styles.personName, styles.flex]}>{request.userPseudo}</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                  <View style={styles.requestActions}>
                    <Button
                      label="Refuser"
                      variant="danger"
                      style={styles.flex}
                      loading={pendingAction === `refuse:${request.id}`}
                      disabled={pendingAction !== null}
                      onPress={() =>
                        runAction(
                          `refuse:${request.id}`,
                          () => refuseParticipation(request.id),
                          "Impossible de refuser la demande."
                        )
                      }
                    />
                    <Button
                      label="Accepter"
                      style={styles.flex}
                      loading={pendingAction === `accept:${request.id}`}
                      disabled={pendingAction !== null || isFull}
                      onPress={() =>
                        runAction(
                          `accept:${request.id}`,
                          () => acceptParticipation(request.id),
                          "Impossible d'accepter la demande."
                        )
                      }
                    />
                  </View>
                </View>
              ))}
              {isFull ? (
                <Text style={styles.caption}>
                  L’activité est complète : tu ne peux plus accepter de demande.
                </Text>
              ) : null}
            </Section>
          ) : null}

          {participants ? (
            <Section title={`Participants (${accepted.length})`}>
              {accepted.length === 0 ? (
                <Text style={styles.captionLeft}>Aucun participant confirmé pour l’instant.</Text>
              ) : (
                accepted.map((participant) => (
                  <Pressable
                    key={participant.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Voir le profil de ${participant.userPseudo}`}
                    onPress={() => openProfile(participant.userId)}
                    style={({ pressed }) => [styles.personRow, pressed && styles.personPressed]}
                  >
                    <Avatar uri={participant.userAvatar} name={participant.userPseudo} size={40} />
                    <Text style={[styles.personName, styles.flex]}>
                      {participant.userPseudo}
                      {participant.userId === userId ? " (toi)" : ""}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                ))
              )}
            </Section>
          ) : null}
        </View>
      </ScrollView>

      {/* Bouton retour posé sur la photo */}
      <SafeAreaView edges={["top"]} style={styles.topBar} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          style={styles.roundButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager l'activité"
          onPress={() => void shareActivity()}
          style={styles.roundButton}
          hitSlop={8}
        >
          <Ionicons name={Platform.OS === "ios" ? "share-outline" : "share-social-outline"} size={21} color={Colors.text} />
        </Pressable>
      </SafeAreaView>

      {activity.audience !== "ALL" ? (
        <GenderPrompt
          audience={activity.audience}
          visible={genderPromptVisible}
          onCancel={() => setGenderPromptVisible(false)}
          onSaved={() => {
            setGenderPromptVisible(false);
            requestToJoin(activity.id);
          }}
        />
      ) : null}

      {footer ? (
        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          {footer}
        </SafeAreaView>
      ) : null}
    </View>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={brand.primary} />
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  hero: {
    height: 260,
    backgroundColor: Colors.text,
  },
  heroShade: {
    backgroundImage: Gradients.photoShade,
  },
  sheet: {
    marginTop: -24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.heading,
    fontSize: 24,
  },
  infoList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  body: {
    ...Typography.body,
    flexShrink: 1,
  },
  description: {
    marginTop: Spacing.lg,
  },
  statusChip: {
    marginLeft: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  toneSuccess: {
    color: Colors.success,
    backgroundColor: Colors.successSoft,
  },
  toneDanger: {
    color: Colors.danger,
    backgroundColor: Colors.dangerSoft,
  },
  toneNeutral: {
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
    color: brand.primary,
    backgroundColor: brand.primarySoft,
  },
  // Public réservé : badge plein, bien visible.
  tagAudience: {
    color: Colors.textOnPrimary,
    backgroundColor: brand.primary,
  },
  caption: {
    ...Typography.caption,
    fontSize: 14,
    textAlign: "center",
  },
  reserved: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 48,
  },
  captionLeft: {
    ...Typography.caption,
    fontSize: 14,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subheading,
    fontSize: 18,
    marginBottom: Spacing.md,
  },
  sectionBody: {
    gap: Spacing.md,
  },
  organizer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    ...Shadow.card,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 48,
  },
  personPressed: {
    opacity: 0.6,
  },
  personName: {
    ...Typography.body,
    fontWeight: "600",
  },
  participationStatus: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
    color: Colors.warning,
    backgroundColor: Colors.warningSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    overflow: "hidden",
  },
  requestCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 52,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: brand.primary,
    backgroundImage: brand.gradient,
  },
  chatLinkPressed: {
    opacity: 0.85,
  },
  chatLinkLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textOnPrimary,
  },
  organizerActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginTop: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    ...Shadow.card,
  },
  footer: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
