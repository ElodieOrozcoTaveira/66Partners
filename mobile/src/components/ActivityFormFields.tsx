import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { useAsync } from "../hooks/useAsync";
import {
  CITY_MAX,
  DESCRIPTION_MAX,
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  TITLE_MAX,
  type ActivityFormState,
} from "../lib/activityForm";
import { formatActivityDay, formatActivityTime } from "../lib/date";
import { LEVEL_LABELS } from "../lib/labels";
import { getSportVisual } from "../lib/sportVisuals";
import { preloadVilles, searchVilles, type VilleSuggestion } from "../lib/villes";
import { getSports } from "../services/sports.service";
import type { Sport, SportLevel } from "../types/domain";
import { ErrorState, LoadingState } from "./ui/StateViews";
import { TextField } from "./ui/TextField";

/**
 * Champs du formulaire d'activité, partagés entre la création (en étapes)
 * et la modification (sur une page).
 */

const TIME_ZONE = "Europe/Paris";
const LEVELS = Object.keys(LEVEL_LABELS) as SportLevel[];

type Update = (patch: Partial<ActivityFormState>) => void;

/** Sports triés par nom, partagés par les écrans du formulaire. */
export function useSortedSports() {
  return useAsync(
    async () => (await getSports()).slice().sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [],
    { errorMessage: "Impossible de récupérer les sports." }
  );
}

export function InfoFields({
  form,
  update,
  sports,
}: {
  form: ActivityFormState;
  update: Update;
  sports: ReturnType<typeof useSortedSports>;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);

  return (
    <>
      <TextField
        label="Titre de l'activité"
        value={form.title}
        onChangeText={(title) => update({ title })}
        placeholder="Ex : Sortie running - Bord de mer"
        maxLength={TITLE_MAX}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Sport</Text>
        {sports.isLoading ? (
          <LoadingState />
        ) : sports.error && !sports.data ? (
          <ErrorState message={sports.error} onRetry={sports.refresh} />
        ) : (
          <View style={styles.chipsWrap} accessibilityRole="radiogroup">
            {sports.data?.map((sport: Sport) => {
              const selected = sport.id === form.sportId;
              return (
                <Pressable
                  key={sport.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => update({ sportId: sport.id })}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <MaterialCommunityIcons
                    name={getSportVisual(sport.name).icon}
                    size={16}
                    color={selected ? brand.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{sport.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <TextField
        label="Description (facultatif)"
        value={form.description}
        onChangeText={(description) => update({ description })}
        placeholder="Parcours, rythme, matériel, point de rendez-vous…"
        multiline
        maxLength={DESCRIPTION_MAX}
        style={styles.textarea}
        textAlignVertical="top"
      />
    </>
  );
}

export function DetailFields({
  form,
  update,
  departmentCode,
  minParticipants = MIN_PARTICIPANTS,
}: {
  form: ActivityFormState;
  update: Update;
  departmentCode: string | null;
  /** Modification : nombre de participants déjà acceptés. */
  minParticipants?: number;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);
  const [iosPicker, setIosPicker] = useState<"date" | "time" | null>(null);
  const cityRequest = useRef(0);
  const floor = Math.max(MIN_PARTICIPANTS, minParticipants);

  useEffect(() => {
    if (departmentCode) preloadVilles(departmentCode);
  }, [departmentCode]);

  const onCityChange = (city: string) => {
    // Saisie libre possible : les coordonnées ne valent que pour une commune choisie.
    update({ city, latitude: null, longitude: null });
    const requestId = ++cityRequest.current;
    if (!departmentCode) return;
    searchVilles(departmentCode, city)
      .then((results) => {
        if (requestId === cityRequest.current) setSuggestions(results);
      })
      .catch(() => {
        if (requestId === cityRequest.current) setSuggestions([]);
      });
  };

  const pickCity = (ville: VilleSuggestion) => {
    cityRequest.current += 1;
    update({ city: ville.nom, latitude: ville.latitude, longitude: ville.longitude });
    setSuggestions([]);
  };

  const onPicked = (mode: "date" | "time", value: Date) => {
    update(mode === "date" ? { startDate: value, dateChosen: true } : { startDate: value, timeChosen: true });
  };

  const openPicker = (mode: "date" | "time") => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: form.startDate,
        mode,
        is24Hour: true,
        minimumDate: mode === "date" ? new Date() : undefined,
        timeZoneName: TIME_ZONE,
        onValueChange: (_event, date) => onPicked(mode, date),
      });
    } else {
      setIosPicker((current) => (current === mode ? null : mode));
    }
  };

  return (
    <>
      <View>
        <TextField
          label="Lieu"
          value={form.city}
          onChangeText={onCityChange}
          placeholder="Rechercher une commune…"
          maxLength={CITY_MAX}
          autoCorrect={false}
          hint={
            form.city && form.latitude === null
              ? "Choisis une commune dans la liste pour que l'activité apparaisse sur la carte."
              : undefined
          }
        />
        {suggestions.length > 0 ? (
          <View style={styles.suggestions} accessibilityRole="list">
            {suggestions.map((ville) => (
              <Pressable
                key={`${ville.nom}-${ville.codePostal}`}
                accessibilityRole="button"
                onPress={() => pickCity(ville)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
              >
                <Ionicons name="location-outline" size={16} color={brand.primary} />
                <Text style={styles.suggestionText}>
                  {ville.nom}
                  {ville.codePostal ? <Text style={styles.muted}> · {ville.codePostal}</Text> : null}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Date et heure</Text>
        <View style={styles.row}>
          <PickerField
            icon="calendar-outline"
            text={form.dateChosen ? formatActivityDay(form.startDate) : "Date"}
            active={iosPicker === "date"}
            onPress={() => openPicker("date")}
          />
          <PickerField
            icon="time-outline"
            text={form.timeChosen ? formatActivityTime(form.startDate) : "Heure"}
            active={iosPicker === "time"}
            onPress={() => openPicker("time")}
          />
        </View>
        {Platform.OS === "ios" && iosPicker ? (
          <DateTimePicker
            value={form.startDate}
            mode={iosPicker}
            display={iosPicker === "date" ? "inline" : "spinner"}
            locale="fr-FR"
            timeZoneName={TIME_ZONE}
            minuteInterval={5}
            minimumDate={iosPicker === "date" ? new Date() : undefined}
            accentColor={brand.primary}
            onValueChange={(_event, date) => onPicked(iosPicker, date)}
          />
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre de participants</Text>
        <View style={styles.stepper}>
          <StepperButton
            icon="remove"
            label="Un participant de moins"
            disabled={form.maxParticipants <= floor}
            onPress={() => update({ maxParticipants: form.maxParticipants - 1 })}
          />
          <Text style={styles.stepperValue} accessibilityLiveRegion="polite">
            {form.maxParticipants}
          </Text>
          <StepperButton
            icon="add"
            label="Un participant de plus"
            disabled={form.maxParticipants >= MAX_PARTICIPANTS}
            onPress={() => update({ maxParticipants: form.maxParticipants + 1 })}
          />
        </View>
        {minParticipants > MIN_PARTICIPANTS ? (
          <Text style={styles.muted}>{minParticipants} participants déjà acceptés.</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Niveau requis</Text>
        <View style={styles.chipsWrap} accessibilityRole="radiogroup">
          {LEVELS.map((level) => {
            const selected = form.levelRequired === level;
            return (
              <Pressable
                key={level}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => update({ levelRequired: level })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{LEVEL_LABELS[level]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.label}>Covoiturage</Text>
          <Text style={styles.muted}>Les participants pourront demander une place.</Text>
        </View>
        <Switch
          value={form.carpoolEnabled}
          onValueChange={(carpoolEnabled) => update({ carpoolEnabled })}
          trackColor={{ true: brand.primary, false: Colors.border }}
          thumbColor={Colors.background}
          accessibilityLabel="Proposer le covoiturage"
        />
      </View>
    </>
  );
}

function PickerField({
  icon,
  text,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.pickerField, active && styles.pickerFieldActive]}>
      <Ionicons name={icon} size={18} color={brand.primary} />
      <Text style={styles.pickerText} numberOfLines={1}>
        {text}
      </Text>
    </Pressable>
  );
}

function StepperButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.stepperButton, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={22} color={Colors.text} />
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    field: {
      gap: Spacing.sm,
    },
    label: {
      ...Typography.label,
    },
    muted: {
      ...Typography.caption,
    },
    row: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    pressed: {
      opacity: 0.7,
    },
    disabled: {
      opacity: 0.4,
    },
    textarea: {
      minHeight: 110,
      paddingTop: Spacing.md,
    },
    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 38,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    chipSelected: {
      borderColor: brand.primary,
      backgroundColor: brand.primarySoft,
    },
    chipLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    chipLabelSelected: {
      color: brand.primary,
    },
    suggestions: {
      marginTop: Spacing.xs,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    suggestion: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 46,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    suggestionText: {
      ...Typography.body,
    },
    pickerField: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 52,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    pickerFieldActive: {
      borderColor: brand.primary,
    },
    pickerText: {
      flexShrink: 1,
      fontSize: 15,
      color: Colors.text,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.lg,
    },
    stepperButton: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    stepperValue: {
      minWidth: 40,
      textAlign: "center",
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
  });
