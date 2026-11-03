import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router, useLocalSearchParams } from "expo-router";

import { Fact, MiniStat, Panel, StatGrid, StatusBadge } from "../../../src/components/admin/AdminUI";
import { SportBadgeRow } from "../../../src/components/SportBadgeRow";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Button } from "../../../src/components/ui/Button";
import { ErrorState, LoadingState } from "../../../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../../../src/constants/theme";
import { useAdmin } from "../../../src/context/AdminContext";
import { useBrand } from "../../../src/context/BrandContext";
import { useAsync } from "../../../src/hooks/useAsync";
import {
  ACTIVITY_STATUS_COLORS,
  ADMIN_ACTIVITY_STATUS_LABELS,
  ADMIN_PARTICIPATION_STATUS_LABELS,
  FALLBACK_COLOR,
  PARTICIPATION_STATUS_COLORS,
  PROVIDER_LABELS,
  formatDate,
  formatDateTime,
} from "../../../src/lib/adminLabels";
import { WEEKDAY_LABELS, formatTimeSlot } from "../../../src/lib/labels";
import { haptics } from "../../../src/lib/haptics";
import { deleteAdminUser, fetchAdminUser } from "../../../src/services/admin.service";
import { getApiErrorMessage } from "../../../src/services/api";
import type { Weekday } from "../../../src/types/domain";

/** Fiche complète d'un membre (mêmes informations que la fiche du site web). */
export default function AdminUserDetailScreen() {
  const brand = useBrand();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const { notifyDataChanged } = useAdmin();
  const [isDeleting, setIsDeleting] = useState(false);

  const detail = useAsync(() => fetchAdminUser(id), [id], { errorMessage: "Impossible de charger cette fiche." });

  if (detail.isLoading) return <LoadingState />;
  // Message du serveur (ex. compte introuvable) ou erreur réseau.
  if (!detail.data) return <ErrorState message={detail.error ?? "Erreur de chargement."} onRetry={detail.refresh} />;

  const user = detail.data;
  const openActivity = (activityId: string) =>
    router.push({ pathname: "/admin/activity/[id]", params: { id: activityId } });

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAdminUser(user.id);
      haptics.success();
      notifyDataChanged();
      router.back();
    } catch (err) {
      setIsDeleting(false);
      Alert.alert("Suppression impossible", getApiErrorMessage(err, "Impossible de supprimer ce compte pour le moment."));
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      `Supprimer le compte de ${user.pseudo} ?`,
      "Cette action est définitive : le compte et les données personnelles associées seront supprimés. Les activités créées par cet utilisateur resteront visibles pour les autres participants.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer définitivement", style: "destructive", onPress: () => void performDelete() },
      ]
    );

  const connexion =
    [user.hasPassword ? "Mot de passe" : null, ...user.providers.map((p) => PROVIDER_LABELS[p] ?? p)]
      .filter(Boolean)
      .join(" · ") || "—";

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={detail.isRefreshing} onRefresh={detail.refresh} tintColor={brand.primary} />}
    >
      <View style={styles.hero}>
        <Avatar uri={user.avatar} name={user.pseudo} size={72} />
        <View style={styles.heroText}>
          <Text style={styles.pseudo}>{user.pseudo}</Text>
          <Text style={styles.caption} selectable>
            {user.email}
          </Text>
          {user.city ? <Text style={styles.caption}>{user.city}</Text> : null}
          {user.headline ? <Text style={styles.headline}>{user.headline}</Text> : null}
        </View>
      </View>

      <StatGrid>
        <MiniStat icon="calendar" label="Activités créées" value={user.counts.activitiesCreated} />
        <MiniStat
          icon="person-add"
          label="Participations"
          value={user.counts.participations}
          hint={`${user.counts.participationsAccepted} acceptée${user.counts.participationsAccepted > 1 ? "s" : ""}`}
        />
        <MiniStat icon="chatbubble" label="Messages envoyés" value={user.counts.messagesSent} />
        <MiniStat icon="camera" label="Photos partagées" value={user.counts.photos} />
        <MiniStat icon="notifications" label="Notifs non lues" value={user.counts.notificationsUnread} />
        <MiniStat label="Notifs push" value={user.pushEnabled ? "Oui" : "Non"} />
      </StatGrid>

      <Panel title="Compte">
        <View>
          <Fact label="Connexion" value={connexion} />
          <Fact label="Inscription" value={formatDateTime(user.createdAt)} />
          <Fact label="Dernière modification" value={formatDateTime(user.updatedAt)} />
          <Fact label="CGU acceptées" value={user.termsAcceptedAt ? formatDate(user.termsAcceptedAt) : "Non enregistré"} />
        </View>
      </Panel>

      <Panel title="Territoires">
        {user.territories.length === 0 ? (
          <Text style={styles.caption}>Aucun territoire.</Text>
        ) : (
          user.territories.map((territory) => (
            <View key={territory.code} style={styles.line}>
              <View style={styles.lineText}>
                <Text style={styles.lineTitle}>
                  {territory.name} ({territory.code})
                </Text>
                <Text style={styles.caption}>Rejoint le {formatDate(territory.joinedAt)}</Text>
              </View>
              {territory.isDefault ? <StatusBadge label="Principal" color="#2563eb" /> : null}
            </View>
          ))
        )}
      </Panel>

      <Panel title="Profil">
        <View>
          <Fact label="Ce que je recherche" value={user.lookingFor || "—"} />
          <Fact label="Ouvert à" value={user.openTo || "—"} />
        </View>
        <Text style={styles.subtitle}>Sports favoris</Text>
        {user.favoriteSports.length === 0 ? (
          <Text style={styles.caption}>Aucun sport favori.</Text>
        ) : (
          <SportBadgeRow sports={user.favoriteSports.map((name) => ({ id: name, name }))} size={40} />
        )}
      </Panel>

      <Panel title="Disponibilités">
        {user.availabilities.length === 0 ? (
          <Text style={styles.caption}>Aucune disponibilité renseignée.</Text>
        ) : (
          user.availabilities.map((slot, i) => (
            <Text key={`${slot.weekday}-${slot.startTime}-${i}`} style={styles.body}>
              {WEEKDAY_LABELS[slot.weekday as Weekday] ?? slot.weekday} · {formatTimeSlot(slot.startTime)} –{" "}
              {formatTimeSlot(slot.endTime)}
            </Text>
          ))
        )}
      </Panel>

      <Panel title="Activités créées" subtitle={`${user.activitiesCreated.length} au total`}>
        {user.activitiesCreated.length === 0 ? (
          <Text style={styles.caption}>Aucune activité créée.</Text>
        ) : (
          user.activitiesCreated.map((activity) => (
            <Pressable
              key={activity.id}
              accessibilityRole="button"
              onPress={() => openActivity(activity.id)}
              style={({ pressed }) => [styles.line, pressed && styles.pressed]}
            >
              <View style={styles.lineText}>
                <Text style={styles.lineTitle} numberOfLines={1}>
                  {activity.title}
                </Text>
                <Text style={styles.caption} numberOfLines={1}>
                  {activity.sportName} · {activity.city} · {formatDate(activity.startDate)} ·{" "}
                  {activity.participantsCount}/{activity.maxParticipants}
                </Text>
              </View>
              <StatusBadge
                label={ADMIN_ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
                color={ACTIVITY_STATUS_COLORS[activity.status] ?? FALLBACK_COLOR}
              />
            </Pressable>
          ))
        )}
      </Panel>

      <Panel
        title="Participations"
        subtitle={`${user.participations.length} demande${user.participations.length > 1 ? "s" : ""}`}
      >
        {user.participations.length === 0 ? (
          <Text style={styles.caption}>Aucune demande de participation.</Text>
        ) : (
          user.participations.map((participation) => (
            <Pressable
              key={participation.activityId}
              accessibilityRole="button"
              onPress={() => openActivity(participation.activityId)}
              style={({ pressed }) => [styles.line, pressed && styles.pressed]}
            >
              <View style={styles.lineText}>
                <Text style={styles.lineTitle} numberOfLines={1}>
                  {participation.title}
                </Text>
                <Text style={styles.caption} numberOfLines={1}>
                  {participation.sportName} · {formatDate(participation.startDate)}
                </Text>
              </View>
              <StatusBadge
                label={ADMIN_PARTICIPATION_STATUS_LABELS[participation.status] ?? participation.status}
                color={PARTICIPATION_STATUS_COLORS[participation.status] ?? FALLBACK_COLOR}
              />
            </Pressable>
          ))
        )}
      </Panel>

      <Button label="Supprimer ce compte" variant="danger" loading={isDeleting} onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  pressed: { opacity: 0.7 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroText: { flex: 1, gap: 2 },
  pseudo: { ...Typography.heading },
  headline: { ...Typography.body, fontSize: 14, marginTop: 4 },
  caption: { ...Typography.caption },
  body: { ...Typography.body, fontSize: 14 },
  subtitle: { ...Typography.label },
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
