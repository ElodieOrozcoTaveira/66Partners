import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { router, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { SafeAreaView } from "react-native-safe-area-context";

import { DetailFields, InfoFields, useSortedSports } from "../../../src/components/ActivityFormFields";
import { Button } from "../../../src/components/ui/Button";
import { ErrorState, LoadingState } from "../../../src/components/ui/StateViews";
import { Colors, Spacing } from "../../../src/constants/theme";
import { useAuth } from "../../../src/context/AuthContext";
import { useTerritory } from "../../../src/context/TerritoryContext";
import { useAsync } from "../../../src/hooks/useAsync";
import {
  buildActivityChanges,
  formFromActivity,
  validateActivityStep,
  type ActivityFormState,
} from "../../../src/lib/activityForm";
import { getActivity, updateActivity } from "../../../src/services/activities.service";
import { getApiErrorCode, getApiErrorMessage } from "../../../src/services/api";
import type { Activity } from "../../../src/types/domain";

/** Modification d'une activité par son organisateur (PATCH, champs modifiés uniquement). */
export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const activity = useAsync(() => getActivity(id), [id], {
    enabled: Boolean(id),
    errorMessage: "Impossible de charger cette activité.",
  });

  if (activity.isLoading) return <LoadingState />;
  if (!activity.data) {
    return (
      <ErrorState message={activity.error ?? "Impossible de charger cette activité."} onRetry={activity.refresh} />
    );
  }
  if (activity.data.creatorId !== user?.id) {
    return <ErrorState message="Seul l'organisateur peut modifier cette activité." />;
  }

  // Le formulaire n'est monté qu'une fois l'activité chargée : état initial simple.
  return <EditForm activity={activity.data} />;
}

function EditForm({ activity }: { activity: Activity }) {
  const { territories } = useTerritory();
  const sports = useSortedSports();
  const headerHeight = useHeaderHeight();
  const [original] = useState<ActivityFormState>(() => formFromActivity(activity));
  const [form, setForm] = useState<ActivityFormState>(original);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Communes proposées : département du territoire de l'activité.
  const departmentCode =
    territories.find((territory) => territory.id === activity.territoryId)?.inseeDepartmentCode ?? null;

  const update = (patch: Partial<ActivityFormState>) => {
    setForm((previous) => ({ ...previous, ...patch }));
    setError(null);
  };

  const save = async () => {
    const dateChanged = form.startDate.getTime() !== original.startDate.getTime();
    const problem = validateActivityStep(3, form, new Date(), {
      requireFutureDate: dateChanged,
      minParticipants: activity.participantsCount,
    });
    if (problem) {
      setError(problem);
      return;
    }

    const changes = buildActivityChanges(original, form);
    if (Object.keys(changes).length === 0) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      await updateActivity(activity.id, changes);
      router.back();
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === "GENDER_REQUIRED" || code === "AUDIENCE_RESTRICTED") {
        setError(
          "Pour réserver ton activité à un public, ton profil doit indiquer le genre correspondant (Modifier mon profil)."
        );
      } else {
        setError(getApiErrorMessage(err, "Impossible d'enregistrer les modifications."));
      }
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <InfoFields form={form} update={update} sports={sports} />
          <DetailFields
            form={form}
            update={update}
            departmentCode={departmentCode}
            minParticipants={activity.participantsCount}
            audienceLocked={activity.participantsCount > 0}
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Enregistrer" onPress={save} loading={isSaving} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
