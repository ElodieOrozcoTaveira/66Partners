import { useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { ChipRow, StatusBadge } from "../../../src/components/admin/AdminUI";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../../../src/components/ui/StateViews";
import { Colors, Radius, Spacing, Typography } from "../../../src/constants/theme";
import { useAdmin } from "../../../src/context/AdminContext";
import { useBrand } from "../../../src/context/BrandContext";
import { useAsync } from "../../../src/hooks/useAsync";
import { REPORT_CONTEXT_LABELS, REPORT_REASON_LABELS, formatDateTime } from "../../../src/lib/adminLabels";
import {
  fetchAdminReports,
  updateAdminReport,
  type AdminReport,
  type AdminReportStatus,
} from "../../../src/services/admin.service";
import { getApiErrorMessage, resolveMediaUrl } from "../../../src/services/api";

const STATUS_OPTIONS: { value: AdminReportStatus; label: string }[] = [
  { value: "OPEN", label: "À traiter" },
  { value: "RESOLVED", label: "Traités" },
];

/**
 * Signalements envoyés par les membres. Les stores demandent de les traiter
 * rapidement : supprimer le compte en cause se fait depuis sa fiche membre.
 */
export default function AdminReportsScreen() {
  const brand = useBrand();
  const { isAdmin, dataVersion } = useAdmin();
  const [status, setStatus] = useState<AdminReportStatus>("OPEN");
  const [pending, setPending] = useState<string | null>(null);

  const reports = useAsync(() => fetchAdminReports(status), [status, dataVersion], {
    enabled: isAdmin,
    errorMessage: "Impossible de charger les signalements.",
  });
  const { setData } = reports;

  const toggle = async (report: AdminReport) => {
    const next: AdminReportStatus = report.status === "OPEN" ? "RESOLVED" : "OPEN";
    setPending(report.id);
    try {
      await updateAdminReport(report.id, next);
      // Il change d'onglet : retiré de la liste affichée.
      setData((current) => current?.filter((item) => item.id !== report.id));
    } catch (err) {
      Alert.alert("Action impossible", getApiErrorMessage(err, "Réessaie dans un instant."));
    } finally {
      setPending(null);
    }
  };

  const header = (
    <View style={styles.header}>
      <ChipRow options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      {reports.data ? (
        <Text style={styles.caption}>
          {reports.data.length} signalement{reports.data.length > 1 ? "s" : ""}
          {status === "OPEN" ? " à traiter" : " traité" + (reports.data.length > 1 ? "s" : "")}
        </Text>
      ) : null}
    </View>
  );

  if (reports.isLoading) return <LoadingState />;
  if (!reports.data) return <ErrorState message={reports.error ?? "Erreur de chargement."} onRetry={reports.refresh} />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={reports.data}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={reports.isRefreshing} onRefresh={reports.refresh} tintColor={brand.primary} />}
      ListEmptyComponent={
        <EmptyState
          icon="shield-checkmark-outline"
          title={status === "OPEN" ? "Aucun signalement à traiter" : "Aucun signalement traité"}
        />
      }
      renderItem={({ item }) => (
        <ReportCard report={item} busy={pending === item.id} disabled={pending !== null} onToggle={() => void toggle(item)} />
      )}
    />
  );
}

function ReportCard({
  report,
  busy,
  disabled,
  onToggle,
}: {
  report: AdminReport;
  busy: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const reported = report.reportedUser;
  const openUser = (id: string) => router.push({ pathname: "/admin/user/[id]", params: { id } });
  const photo = resolveMediaUrl(report.photoUrl);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <StatusBadge label={REPORT_REASON_LABELS[report.reason] ?? report.reason} color={Colors.danger} />
        <Text style={styles.context}>{REPORT_CONTEXT_LABELS[report.context] ?? report.context}</Text>
      </View>

      {reported ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fiche de ${reported.pseudo}`}
          onPress={() => openUser(reported.id)}
          style={({ pressed }) => [styles.person, pressed && styles.pressed]}
        >
          <Avatar uri={reported.avatar} name={reported.pseudo} size={38} />
          <View style={styles.personText}>
            <Text style={styles.pseudo}>{reported.pseudo}</Text>
            <Text style={styles.meta}>
              {reported.openReports} signalement{reported.openReports > 1 ? "s" : ""} en attente
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>
      ) : (
        <Text style={styles.meta}>Membre signalé : compte supprimé</Text>
      )}

      {report.targetExcerpt ? (
        <View style={styles.excerpt}>
          <Text style={styles.excerptText}>{report.targetExcerpt}</Text>
        </View>
      ) : null}
      {photo ? <Image source={photo} style={styles.photo} contentFit="cover" accessibilityLabel="Photo signalée" /> : null}
      {report.details ? <Text style={styles.details}>« {report.details} »</Text> : null}

      <Text style={styles.meta}>
        Par {report.reporter?.pseudo ?? "compte supprimé"} · {formatDateTime(report.createdAt)}
        {report.resolvedAt ? `\nTraité le ${formatDateTime(report.resolvedAt)}` : ""}
      </Text>

      <Button
        label={report.status === "OPEN" ? "Marquer comme traité" : "Rouvrir"}
        variant={report.status === "OPEN" ? "primary" : "secondary"}
        loading={busy}
        disabled={disabled}
        onPress={onToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl, flexGrow: 1 },
  header: { gap: Spacing.sm, marginBottom: Spacing.xs },
  caption: { ...Typography.caption },
  pressed: { opacity: 0.7 },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.sm },
  context: { ...Typography.caption, fontWeight: "700" },
  person: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  personText: { flex: 1, gap: 2 },
  pseudo: { ...Typography.label, fontSize: 15 },
  meta: { ...Typography.caption, fontSize: 12 },
  excerpt: { padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surface },
  excerptText: { ...Typography.body, fontSize: 14 },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: Radius.md, backgroundColor: Colors.surface },
  details: { ...Typography.body, fontSize: 14, fontStyle: "italic" },
});
