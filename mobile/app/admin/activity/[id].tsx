import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router, useLocalSearchParams } from "expo-router";

import { Fact, MiniStat, Panel, StatGrid, StatusBadge } from "../../../src/components/admin/AdminUI";
import { SportIcon } from "../../../src/components/SportIcon";
import { Avatar } from "../../../src/components/ui/Avatar";
import { ErrorState, LoadingState } from "../../../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../../../src/constants/theme";
import { useBrand } from "../../../src/context/BrandContext";
import { useAsync } from "../../../src/hooks/useAsync";
import {
  ACTIVITY_STATUS_COLORS,
  ADMIN_ACTIVITY_STATUS_LABELS,
  ADMIN_PARTICIPATION_STATUS_LABELS,
  FALLBACK_COLOR,
  PARTICIPATION_STATUS_COLORS,
  formatDate,
  formatDateTime,
  levelLabel,
} from "../../../src/lib/adminLabels";
import { fetchAdminActivity } from "../../../src/services/admin.service";

/**
 * Fiche complète d'une activité. Comme sur le web, le contenu des messages
 * n'est jamais affiché (confidentialité des discussions), seulement leur nombre.
 */
export default function AdminActivityDetailScreen() {
  const brand = useBrand();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const detail = useAsync(() => fetchAdminActivity(id), [id], { errorMessage: "Impossible de charger cette fiche." });

  if (detail.isLoading) return <LoadingState />;
  if (!detail.data) return <ErrorState message={detail.error ?? "Erreur de chargement."} onRetry={detail.refresh} />;

  const activity = detail.data;
  const openUser = (userId: string) => router.push({ pathname: "/admin/user/[id]", params: { id: userId } });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={detail.isRefreshing} onRefresh={detail.refresh} tintColor={brand.primary} />}
    >
      <View style={styles.hero}>
        <SportIcon sportName={activity.sportName} size={52} />
        <View style={styles.heroText}>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.caption}>
            {activity.sportName} · {activity.city}
          </Text>
          <Text style={styles.when}>{formatDateTime(activity.startDate)}</Text>
          <StatusBadge
            label={ADMIN_ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
            color={ACTIVITY_STATUS_COLORS[activity.status] ?? FALLBACK_COLOR}
          />
        </View>
      </View>

      <StatGrid>
        <MiniStat icon="people" label="Participants" value={activity.counts.accepted} suffix={`/${activity.maxParticipants}`} />
        <MiniStat icon="time" label="En attente" value={activity.counts.pending} hint={`${activity.counts.refused} refusée(s)`} />
        <MiniStat
          icon="chatbubbles"
          label="Messages"
          value={activity.counts.messages}
          hint={
            activity.lastMessageAt
              ? `Dernier le ${formatDate(activity.lastMessageAt)}`
              : `${activity.counts.conversations} discussion(s)`
          }
        />
        <MiniStat icon="camera" label="Photos" value={activity.counts.photos} />
      </StatGrid>

      <Panel title="Informations">
        <View>
          <Fact
            label="Organisateur"
            value={activity.creator ? activity.creator.pseudo : "Compte supprimé"}
            onPress={activity.creator ? () => openUser(activity.creator!.id) : undefined}
          />
          <Fact label="Niveau" value={levelLabel(activity.levelRequired)} />
          <Fact label="Places" value={activity.maxParticipants} />
          <Fact label="Covoiturage" value={activity.carpoolEnabled ? "Proposé" : "Non"} />
          <Fact label="Territoire" value={`${activity.territory.name} (${activity.territory.code})`} />
          <Fact label="Créée le" value={formatDate(activity.createdAt)} />
          <Fact label="Dernière modification" value={formatDateTime(activity.updatedAt)} />
          {activity.latitude != null && activity.longitude != null ? (
            <Fact
              label="Position"
              value="Voir sur la carte"
              onPress={() =>
                void Linking.openURL(
                  `https://www.openstreetmap.org/?mlat=${activity.latitude}&mlon=${activity.longitude}#map=14/${activity.latitude}/${activity.longitude}`
                )
              }
            />
          ) : null}
        </View>
      </Panel>

      <Panel title="Description">
        <Text style={styles.body}>{activity.description?.trim() || "Aucune description."}</Text>
      </Panel>

      <Panel
        title="Participants"
        subtitle={`${activity.participants.length} demande${activity.participants.length > 1 ? "s" : ""} au total`}
      >
        {activity.participants.length === 0 ? (
          <Text style={styles.caption}>Aucune demande de participation.</Text>
        ) : (
          activity.participants.map((participant) => (
            <Pressable
              key={participant.userId}
              accessibilityRole="button"
              accessibilityLabel={`Fiche de ${participant.pseudo}`}
              onPress={() => openUser(participant.userId)}
              style={({ pressed }) => [styles.line, pressed && styles.pressed]}
            >
              <Avatar uri={participant.avatar} name={participant.pseudo} size={38} />
              <View style={styles.lineText}>
                <Text style={styles.lineTitle} numberOfLines={1}>
                  {participant.pseudo}
                </Text>
                <Text style={styles.caption} numberOfLines={1}>
                  Demande le {formatDate(participant.createdAt)}
                  {participant.carpoolRequested ? " · souhaite covoiturer" : ""}
                </Text>
              </View>
              <StatusBadge
                label={ADMIN_PARTICIPATION_STATUS_LABELS[participant.status] ?? participant.status}
                color={PARTICIPATION_STATUS_COLORS[participant.status] ?? FALLBACK_COLOR}
              />
            </Pressable>
          ))
        )}
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  pressed: { opacity: 0.7 },
  hero: {
    flexDirection: "row",
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroText: { flex: 1, gap: 4 },
  title: { ...Typography.heading },
  when: { ...Typography.label },
  caption: { ...Typography.caption },
  body: { ...Typography.body, fontSize: 14 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  lineText: { flex: 1, gap: 2 },
  lineTitle: { ...Typography.label },
});
