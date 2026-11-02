import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { DetailFields, InfoFields, useSortedSports } from "../../src/components/ActivityFormFields";
import { Button } from "../../src/components/ui/Button";
import { ErrorState, LoadingState } from "../../src/components/ui/StateViews";
import type { Brand } from "../../src/constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../../src/constants/theme";
import { useBrand, useBrandStyles } from "../../src/context/BrandContext";
import { useTerritory } from "../../src/context/TerritoryContext";
import {
  buildActivityPayload,
  initialActivityForm,
  validateActivityStep,
  type ActivityFormState,
  type ActivityFormStep,
} from "../../src/lib/activityForm";
import { formatActivityDay, formatActivityTime } from "../../src/lib/date";
import { LEVEL_LABELS } from "../../src/lib/labels";
import { getSportPhoto } from "../../src/lib/sportPhotos";
import { createActivity } from "../../src/services/activities.service";
import { getApiErrorCode, getApiErrorMessage } from "../../src/services/api";
import { haptics } from "../../src/lib/haptics";
import { GenderPrompt } from "../../src/components/GenderPrompt";
import { AUDIENCE_LABELS } from "../../src/lib/audience";

const STEPS: { step: ActivityFormStep; label: string }[] = [
  { step: 1, label: "Infos" },
  { step: 2, label: "Détails" },
  { step: 3, label: "Publication" },
];

export default function CreateActivityScreen() {
  const styles = useBrandStyles(makeStyles);
  const { activeTerritory, isLoading: territoryLoading, refreshTerritories } = useTerritory();
  const departmentCode = activeTerritory?.inseeDepartmentCode ?? null;

  const [step, setStep] = useState<ActivityFormStep>(1);
  const [form, setForm] = useState<ActivityFormState>(() => initialActivityForm());
  const [error, setError] = useState<string | null>(null);
  const [genderPromptVisible, setGenderPromptVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const sports = useSortedSports();

  const update = (patch: Partial<ActivityFormState>) => {
    setForm((previous) => ({ ...previous, ...patch }));
    setError(null);
  };

  const goNext = () => {
    const problem = validateActivityStep(step, form);
    if (problem) {
      haptics.warning();
      setError(problem);
      return;
    }
    setError(null);
    setStep((current) => (current < 3 ? ((current + 1) as ActivityFormStep) : current));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goBack = () => {
    setError(null);
    setStep((current) => (current > 1 ? ((current - 1) as ActivityFormStep) : current));
  };

  const publish = async () => {
    const problem = validateActivityStep(3, form);
    if (problem) {
      setError(problem);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createActivity(buildActivityPayload(form, activeTerritory?.id));
      haptics.success();
      setForm(initialActivityForm());
      setStep(1);
      router.push({ pathname: "/activity/[id]", params: { id: created.id } });
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === "GENDER_REQUIRED") {
        // Activité réservée et genre pas encore renseigné : on le demande,
        // puis on republie (cf. GenderPrompt).
        setGenderPromptVisible(true);
      } else if (code === "AUDIENCE_RESTRICTED" && form.audience !== "ALL") {
        setError(
          `Pour organiser une activité « ${AUDIENCE_LABELS[form.audience].toLowerCase()} », ton profil doit l'indiquer (Modifier mon profil).`
        );
      } else {
        setError(getApiErrorMessage(err, "Impossible de publier l'activité pour le moment."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (territoryLoading) return <LoadingState />;
  if (!activeTerritory) {
    return <ErrorState message="Impossible de déterminer ton territoire." onRetry={refreshTerritories} />;
  }

  const selectedSport = sports.data?.find((sport) => sport.id === form.sportId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Créer une activité
          </Text>
          <Stepper current={step} />
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {step === 1 ? <InfoFields form={form} update={update} sports={sports} /> : null}

          {step === 2 ? <DetailFields form={form} update={update} departmentCode={departmentCode} /> : null}

          {step === 3 ? (
            <>
              <Text style={styles.muted}>Vérifie les informations avant de publier.</Text>
              <View style={styles.preview}>
                <Image
                  source={getSportPhoto(selectedSport?.name ?? "")}
                  contentFit="cover"
                  style={styles.previewPhoto}
                  accessible={false}
                />
                <View style={styles.previewBody}>
                  <Text style={styles.previewTitle}>{form.title.trim()}</Text>
                  <PreviewRow icon="fitness-outline" text={selectedSport?.name ?? "—"} />
                  <PreviewRow icon="location-outline" text={form.city.trim()} />
                  <PreviewRow
                    icon="calendar-outline"
                    text={`${formatActivityDay(form.startDate)} · ${formatActivityTime(form.startDate)}`}
                  />
                  <PreviewRow icon="people-outline" text={`${form.maxParticipants} participants max`} />
                  <PreviewRow
                    icon="speedometer-outline"
                    text={`Niveau ${LEVEL_LABELS[form.levelRequired].toLowerCase()}`}
                  />
                  {form.audience !== "ALL" ? (
                    <PreviewRow icon="shield-checkmark-outline" text={AUDIENCE_LABELS[form.audience]} />
                  ) : null}
                  {form.carpoolEnabled ? <PreviewRow icon="car-outline" text="Covoiturage proposé" /> : null}
                  {form.description.trim() ? (
                    <Text style={styles.previewDescription}>{form.description.trim()}</Text>
                  ) : null}
                  <Text style={styles.muted}>Publiée sur {activeTerritory.brandName}</Text>
                </View>
              </View>
            </>
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 ? (
            <Button label="Retour" variant="secondary" onPress={goBack} style={styles.footerBack} />
          ) : null}
          <Button
            label={step === 3 ? "Publier l'activité" : "Suivant"}
            onPress={step === 3 ? publish : goNext}
            loading={isSubmitting}
            style={styles.flex}
          />
        </View>
      </KeyboardAvoidingView>

      {form.audience !== "ALL" ? (
        <GenderPrompt
          audience={form.audience}
          visible={genderPromptVisible}
          onCancel={() => setGenderPromptVisible(false)}
          onSaved={() => {
            setGenderPromptVisible(false);
            publish();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Stepper({ current }: { current: ActivityFormStep }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.stepperRow} accessible accessibilityLabel={`Étape ${current} sur 3`}>
      {STEPS.map(({ step, label }, index) => {
        const done = step < current;
        const active = step === current;
        return (
          <View key={step} style={styles.stepItem}>
            {index > 0 ? <View style={[styles.stepLine, step <= current && styles.stepLineDone]} /> : null}
            <View style={[styles.stepDot, (active || done) && styles.stepDotActive]}>
              {done ? (
                <Ionicons name="checkmark" size={14} color={Colors.textOnPrimary} />
              ) : (
                <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{step}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PreviewRow({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.previewRow}>
      <Ionicons name={icon} size={16} color={brand.primary} />
      <Text style={styles.previewText}>{text}</Text>
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
    header: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      gap: Spacing.lg,
    },
    title: {
      ...Typography.title,
      fontSize: 26,
    },
    content: {
      padding: Spacing.xl,
      gap: Spacing.lg,
    },
    muted: {
      ...Typography.caption,
    },
    error: {
      color: Colors.danger,
      fontSize: 14,
    },
    stepperRow: {
      flexDirection: "row",
    },
    stepItem: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    stepLine: {
      position: "absolute",
      top: 14,
      right: "50%",
      width: "100%",
      height: 2,
      backgroundColor: Colors.border,
    },
    stepLineDone: {
      backgroundColor: brand.primary,
    },
    stepDot: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    stepDotActive: {
      borderColor: brand.primary,
      backgroundColor: brand.primary,
      backgroundImage: brand.gradientDiagonal,
    },
    stepNumber: {
      fontWeight: "700",
      color: Colors.textSecondary,
    },
    stepNumberActive: {
      color: Colors.textOnPrimary,
    },
    stepLabel: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    stepLabelActive: {
      color: brand.primary,
      fontWeight: "700",
    },
    preview: {
      borderRadius: Radius.lg,
      overflow: "hidden",
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    previewPhoto: {
      height: 150,
    },
    previewBody: {
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    previewTitle: {
      ...Typography.heading,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    previewText: {
      ...Typography.body,
      flexShrink: 1,
    },
    previewDescription: {
      ...Typography.body,
      color: Colors.textSecondary,
      marginTop: Spacing.xs,
    },
    footer: {
      flexDirection: "row",
      gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.background,
    },
    footerBack: {
      minWidth: 110,
    },

  });
