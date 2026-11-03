import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, RefreshControl, StyleSheet, Switch, View, Platform, Share } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { setStatusBarStyle } from "expo-status-bar";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Avatar } from "../../src/components/ui/Avatar";
import { Button } from "../../src/components/ui/Button";
import { ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import { Colors, Fonts, Gradients, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import { useAsync } from "../../src/hooks/useAsync";
import { formatActivityDay, formatActivityTime, formatActivityWhen, formatStartsIn } from "../../src/lib/date";
import { SportIcon } from "../../src/components/SportIcon";
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
  cancelCarpool,
  getParticipations,
  joinActivity,
  refuseParticipation,
  requestCarpool,
  updateActivity,
} from "../../src/services/activities.service";
import { ActivityPhotos } from "../../src/components/ActivityPhotos";
import { useModeration } from "../../src/hooks/useModeration";
import { getApiErrorCode, getApiErrorMessage } from "../../src/services/api";
import { getMyProfile } from "../../src/services/user.service";
import { Celebration } from "../../src/components/Celebration";
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

/** Hauteur de la photo en tête de l'écran. */
const HERO_HEIGHT = 280;

export default function ActivityDetailScreen() {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  // celebrate=created : on arrive juste après avoir publié l'activité.
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const [celebration, setCelebration] = useState<"joined" | "created" | null>(
    celebrate === "created" ? "created" : null
  );
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [genderPromptVisible, setGenderPromptVisible] = useState(false);
  const { showMenu, reportModal } = useModeration();

  // Défilement : photo en parallaxe, barre du haut qui devient opaque.
  const [scrollY] = useState(() => new Animated.Value(0));
  const solidHeader = useRef(false);
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(solidHeader.current ? "dark" : "light");
      const listener = scrollY.addListener(({ value }) => {
        const solid = value > HERO_HEIGHT - 90;
        if (solid === solidHeader.current) return;
        solidHeader.current = solid;
        setStatusBarStyle(solid ? "dark" : "light");
      });
      return () => {
        scrollY.removeListener(listener);
        setStatusBarStyle("dark");
      };
    }, [scrollY])
  );

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
      setCelebration("joined");
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

  // Fil privé covoiturage : `carpool` = identifiant du participant concerné.
  const openCarpoolChat = (participantId: string) =>
    router.push({
      pathname: "/conversation/[activityId]",
      params: { activityId: activity.id, title: activity.title, carpool: participantId },
    });

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
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={
          <RefreshControl
            refreshing={detail.isRefreshing}
            onRefresh={detail.refresh}
            tintColor={Colors.textOnPrimary}
          />
        }
      >
        <View style={styles.hero}>
          {/* Parallaxe au défilement, agrandissement quand on tire vers le bas. */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [-HERO_HEIGHT, 0, HERO_HEIGHT],
                      outputRange: [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.4],
                      extrapolateRight: "clamp",
                    }),
                  },
                  {
                    scale: scrollY.interpolate({
                      inputRange: [-HERO_HEIGHT, 0],
                      outputRange: [2, 1],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={getSportPhoto(activity.sportName)}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
              accessible={false}
            />
            <View style={[styles.heroShade, StyleSheet.absoluteFill]} />
          </Animated.View>
          <View style={styles.heroContent}>
            <View style={styles.heroSport}>
              <SportIcon sportName={activity.sportName} size={34} />
            </View>
            <Text style={styles.heroSportName} numberOfLines={1}>
              {activity.sportName}
            </Text>
            {!isClosed ? (
              <View style={styles.heroCountdown}>
                <Ionicons name="time" size={13} color={Colors.text} />
                <Text style={styles.heroCountdownText}>{formatStartsIn(activity.startDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title} accessibilityRole="header">
            {activity.title}
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar"
              label="Quand"
              text={`${formatActivityDay(new Date(activity.startDate))} · ${formatActivityTime(new Date(activity.startDate))}`}
            />
            <View style={styles.infoDivider} />
            <InfoRow icon="location" label="Où" text={activity.city} />
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="people" size={18} color={brand.primary} />
              </View>
              <View style={styles.flex}>
                <View style={styles.infoHeader}>
                  <Text style={styles.infoLabel}>Participants</Text>
                  <Text style={[styles.statusChip, statusTone]}>
                    {isFull && !isClosed ? "Complète" : statusLabel}
                  </Text>
                </View>
                <Text style={styles.infoValue}>
                  {activity.participantsCount}/{activity.maxParticipants}
                  {!isClosed && !isFull ? ` · ${placesLeft} place${placesLeft > 1 ? "s" : ""} restante${placesLeft > 1 ? "s" : ""}` : ""}
                </Text>
                <View style={styles.gauge} accessible={false}>
                  <View
                    style={[
                      styles.gaugeFill,
                      {
                        width: `${Math.max(Math.min(1, activity.participantsCount / Math.max(1, activity.maxParticipants)), 0.04) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
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

          {/* Covoiturage (même fonctionnement que le web) : un participant
              accepté l'active, ce qui ouvre un fil privé avec l'organisateur. */}
          {activity.carpoolEnabled ? (
            <Section title="🚗 Covoiturage">
              <Text style={styles.captionLeft}>
                {isCreator
                  ? "Tu proposes du covoiturage. Les participants intéressés apparaissent avec une voiture dans la liste ci-dessous."
                  : "L’organisateur propose du covoiturage."}
              </Text>
              {!isCreator && myParticipation?.status === "ACCEPTED" ? (
                <>
                  <View style={styles.carpoolRow}>
                    <Text style={[styles.personName, styles.flex]}>Je souhaite covoiturer</Text>
                    <Switch
                      accessibilityLabel="Je souhaite covoiturer"
                      value={myParticipation.carpoolRequested}
                      disabled={pendingAction !== null}
                      onValueChange={(wanted) =>
                        runAction(
                          "carpool",
                          () => (wanted ? requestCarpool(activity.id) : cancelCarpool(activity.id)),
                          "Impossible de mettre à jour le covoiturage."
                        )
                      }
                      trackColor={{ true: brand.primary }}
                    />
                  </View>
                  {myParticipation.carpoolRequested ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openCarpoolChat(userId)}
                      style={({ pressed }) => [styles.carpoolLink, pressed && styles.personPressed]}
                    >
                      <Ionicons name="car-outline" size={20} color={brand.primary} />
                      <Text style={[styles.carpoolLinkLabel, styles.flex]}>Discuter du trajet avec l’organisateur</Text>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </Section>
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
                    {/* Organisateur : fil privé avec chaque participant qui veut covoiturer. */}
                    {isCreator && activity.carpoolEnabled && participant.carpoolRequested ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Covoiturage avec ${participant.userPseudo}`}
                        onPress={() => openCarpoolChat(participant.userId)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.carpoolBadge, pressed && styles.personPressed]}
                      >
                        <Ionicons name="car" size={16} color={brand.primary} />
                        <Text style={styles.carpoolBadgeText}>Covoit.</Text>
                      </Pressable>
                    ) : null}
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </Pressable>
                ))
              )}
            </Section>
          ) : null}

          {/* Photos souvenirs : organisateur et participants acceptés. */}
          {isCreator || myParticipation?.status === "ACCEPTED" ? (
            <ActivityPhotos activityId={activity.id} hasEnded={isPast} currentUserId={userId} />
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Bouton retour posé sur la photo */}
      <SafeAreaView edges={["top"]} style={styles.topBar} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.topBarBackground,
            { opacity: scrollY.interpolate({ inputRange: [HERO_HEIGHT - 130, HERO_HEIGHT - 80], outputRange: [0, 1], extrapolate: "clamp" }) },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          style={styles.roundButton}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Animated.View
          style={[
            styles.topBarTitleWrap,
            { opacity: scrollY.interpolate({ inputRange: [HERO_HEIGHT - 90, HERO_HEIGHT - 50], outputRange: [0, 1], extrapolate: "clamp" }) },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {activity.title}
          </Text>
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager l'activité"
          onPress={() => void shareActivity()}
          style={styles.roundButton}
          hitSlop={8}
        >
          <Ionicons name={Platform.OS === "ios" ? "share-outline" : "share-social-outline"} size={21} color={Colors.text} />
        </Pressable>
        {/* Signaler l'activité / bloquer l'organisateur (pas sur ses propres activités). */}
        {!isCreator ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Signaler l'activité ou bloquer l'organisateur"
            onPress={() =>
              showMenu({
                title: activity.title,
                report: { context: "ACTIVITY", targetId: activity.id, label: "Signaler cette activité" },
                block: activity.creatorId
                  ? { userId: activity.creatorId, pseudo: activity.creatorPseudo ?? "l'organisateur" }
                  : undefined,
                onBlocked: () => (router.canGoBack() ? router.back() : router.replace("/(tabs)")),
              })
            }
            style={styles.roundButton}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-horizontal" size={21} color={Colors.text} />
          </Pressable>
        ) : null}
      </SafeAreaView>
      {reportModal}

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

      <Celebration
        visible={celebration !== null}
        title={celebration === "created" ? "Activité publiée !" : "Demande envoyée !"}
        message={
          celebration === "created"
            ? "Les sportifs de ton territoire peuvent maintenant la voir et te rejoindre."
            : "L’organisateur va recevoir ta demande. Tu seras prévenu dès qu’il répond."
        }
        onClose={() => {
          setCelebration(null);
          if (celebrate) router.setParams({ celebrate: "" });
        }}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  text: string;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label} : ${text}`}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={brand.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{text}</Text>
      </View>
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
    height: HERO_HEIGHT,
    backgroundColor: Colors.text,
    justifyContent: "flex-end",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 24 + Spacing.md,
  },
  heroSport: {
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  heroSportName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textOnPrimary,
  },
  heroCountdown: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: brand.accent,
    backgroundImage: brand.badgeGradient,
  },
  heroCountdownText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.text,
  },
  infoCard: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    ...Shadow.card,
  },
  infoDivider: {
    height: 1,
    marginLeft: 52,
    backgroundColor: Colors.border,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.primarySoft,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  gauge: {
    height: 5,
    marginTop: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: brand.primary,
    backgroundImage: brand.gradient,
  },
  topBarBackground: {
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  topBarTitleWrap: {
    flex: 1,
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  topBarTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.text,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
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
  carpoolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 48,
  },
  carpoolLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: brand.primarySoft,
  },
  carpoolLinkLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: brand.primary,
  },
  carpoolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: brand.primarySoft,
  },
  carpoolBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: brand.primary,
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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
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
