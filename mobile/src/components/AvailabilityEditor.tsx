import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./ui/Text";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors, Radius, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { formatTimeSlot, WEEKDAYS, WEEKDAY_LABELS } from "../lib/labels";
import { dateFromHHMM, toHHMM, validateTimeSlot } from "../lib/timeSlot";
import { getApiErrorMessage } from "../services/api";
import { createAvailability, deleteAvailability } from "../services/user.service";
import type { Availability, Weekday } from "../types/domain";
import { Button } from "./ui/Button";
import { haptics } from "../lib/haptics";

interface AvailabilityEditorProps {
  availabilities: Availability[];
  onChange: (next: Availability[]) => void;
}

type TimeField = "start" | "end";

/** Ajout / suppression des créneaux de disponibilité (mêmes routes que le web). */
export function AvailabilityEditor({ availabilities, onChange }: AvailabilityEditorProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [isAdding, setIsAdding] = useState(false);
  const [weekday, setWeekday] = useState<Weekday>("SATURDAY");
  // Valeurs par défaut du web (GererDisponibilitesModal) : 18:00 – 20:00.
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [iosPicker, setIosPicker] = useState<TimeField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setTime = (field: TimeField, date: Date) => {
    setError(null);
    if (field === "start") setStartTime(toHHMM(date));
    else setEndTime(toHHMM(date));
  };

  const openPicker = (field: TimeField) => {
    const value = dateFromHHMM(field === "start" ? startTime : endTime);
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value,
        mode: "time",
        is24Hour: true,
        onValueChange: (_event, date) => setTime(field, date),
      });
    } else {
      setIosPicker((current) => (current === field ? null : field));
    }
  };

  const add = async () => {
    const problem = validateTimeSlot(startTime, endTime);
    if (problem) {
      setError(problem);
      return;
    }
    setIsSaving(true);
    try {
      const created = await createAvailability({ weekday, startTime, endTime });
      const next = [...availabilities, created].sort(
        (a, b) =>
          WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) || a.startTime.localeCompare(b.startTime)
      );
      onChange(next);
      haptics.success();
      setIsAdding(false);
      setIosPicker(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'ajouter ce créneau."));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = (slot: Availability) => {
    Alert.alert(
      "Supprimer ce créneau ?",
      `${WEEKDAY_LABELS[slot.weekday]} · ${formatTimeSlot(slot.startTime)} – ${formatTimeSlot(slot.endTime)}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeletingId(slot.id);
            try {
              await deleteAvailability(slot.id);
              onChange(availabilities.filter((item) => item.id !== slot.id));
            } catch (err) {
              Alert.alert("Action impossible", getApiErrorMessage(err, "Impossible de supprimer ce créneau."));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {availabilities.length === 0 && !isAdding ? (
        <Text style={styles.caption}>
          Indique quand tu es disponible : les autres membres sauront quand te proposer une sortie.
        </Text>
      ) : null}

      {availabilities.map((slot) => (
        <View key={slot.id} style={styles.slot}>
          <Ionicons name="time-outline" size={18} color={brand.primary} />
          <Text style={styles.slotText}>
            {WEEKDAY_LABELS[slot.weekday]} · {formatTimeSlot(slot.startTime)} – {formatTimeSlot(slot.endTime)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Supprimer le créneau du ${WEEKDAY_LABELS[slot.weekday]}`}
            onPress={() => remove(slot)}
            disabled={deletingId !== null}
            hitSlop={10}
            style={deletingId === slot.id && styles.disabled}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </Pressable>
        </View>
      ))}

      {isAdding ? (
        <View style={styles.form}>
          <Text style={styles.label}>Jour</Text>
          <View style={styles.days} accessibilityRole="radiogroup">
            {WEEKDAYS.map((day) => {
              const selected = day === weekday;
              return (
                <Pressable
                  key={day}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={WEEKDAY_LABELS[day]}
                  onPress={() => setWeekday(day)}
                  style={[styles.day, selected && styles.daySelected]}
                >
                  <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>
                    {WEEKDAY_LABELS[day].slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.times}>
            <TimeButton label="De" value={startTime} active={iosPicker === "start"} onPress={() => openPicker("start")} />
            <TimeButton label="À" value={endTime} active={iosPicker === "end"} onPress={() => openPicker("end")} />
          </View>

          {Platform.OS === "ios" && iosPicker ? (
            <DateTimePicker
              value={dateFromHHMM(iosPicker === "start" ? startTime : endTime)}
              mode="time"
              display="spinner"
              locale="fr-FR"
              minuteInterval={15}
              onValueChange={(_event, date) => setTime(iosPicker, date)}
            />
          ) : null}

          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">
              {error}
            </Text>
          ) : null}

          <View style={styles.formActions}>
            <Button
              label="Annuler"
              variant="ghost"
              onPress={() => {
                setIsAdding(false);
                setIosPicker(null);
                setError(null);
              }}
              style={styles.flex}
            />
            <Button label="Ajouter" onPress={add} loading={isSaving} style={styles.flex} />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsAdding(true)}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add-circle-outline" size={20} color={brand.primary} />
          <Text style={styles.addLabel}>Ajouter un créneau</Text>
        </Pressable>
      )}
    </View>
  );
}

function TimeButton({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label === "De" ? "Heure de début" : "Heure de fin"} : ${value}`}
      onPress={onPress}
      style={[styles.timeButton, active && styles.timeButtonActive]}
    >
      <Text style={styles.timeLabel}>{label}</Text>
      <Text style={styles.timeValue}>{value}</Text>
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: 0.7,
    },
    disabled: {
      opacity: 0.4,
    },
    caption: {
      ...Typography.caption,
      fontSize: 14,
    },
    slot: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 44,
    },
    slotText: {
      ...Typography.body,
      flex: 1,
    },
    form: {
      gap: Spacing.md,
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: Colors.surface,
    },
    label: {
      ...Typography.label,
    },
    days: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    day: {
      minWidth: 44,
      minHeight: 38,
      paddingHorizontal: Spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    daySelected: {
      borderColor: brand.primary,
      backgroundColor: brand.primary,
    },
    dayLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    dayLabelSelected: {
      color: Colors.textOnPrimary,
    },
    times: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    timeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 48,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    timeButtonActive: {
      borderColor: brand.primary,
    },
    timeLabel: {
      ...Typography.caption,
    },
    timeValue: {
      fontSize: 17,
      fontWeight: "700",
      color: Colors.text,
    },
    error: {
      color: Colors.danger,
      fontSize: 14,
    },
    formActions: {
      flexDirection: "row",
      gap: Spacing.md,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      minHeight: 44,
      alignSelf: "flex-start",
    },
    addLabel: {
      color: brand.primary,
      fontWeight: "700",
      fontSize: 15,
    },
  });
