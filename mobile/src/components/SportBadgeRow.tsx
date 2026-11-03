import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./ui/Text";

import { Colors, Spacing } from "../constants/theme";
import { SportBadge } from "./SportBadge";

export interface SportBadgeItem {
  id: string;
  name: string;
  /** Texte secondaire facultatif (ex. niveau), affiché avec le nom. */
  detail?: string;
}

interface SportBadgeRowProps {
  sports: SportBadgeItem[];
  size?: number;
}

const LABEL_VISIBLE_MS = 2500;
const LABEL_HEIGHT = 24;

/**
 * Rangée de pastilles de sport (logos seuls). Toucher une pastille affiche
 * le nom du sport en petit juste en dessous, quelques secondes.
 */
export function SportBadgeRow({ sports, size = 40 }: SportBadgeRowProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toggle = (id: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    timer.current = setTimeout(() => setSelectedId(null), LABEL_VISIBLE_MS);
  };

  return (
    // Place réservée sous la rangée quand un nom est affiché.
    <View style={[styles.row, selectedId && styles.rowWithLabel]}>
      {sports.map((sport) => {
        const selected = sport.id === selectedId;
        const label = sport.detail ? `${sport.name} · ${sport.detail}` : sport.name;
        return (
          <View key={sport.id} style={selected && styles.selectedItem}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              hitSlop={4}
              onPress={() => toggle(sport.id)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <SportBadge name={sport.name} size={size} />
            </Pressable>
            {selected ? (
              <View style={[styles.labelWrap, { top: size + 4 }]} pointerEvents="none">
                <Text style={styles.label} numberOfLines={1} accessibilityLiveRegion="polite">
                  {label}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  rowWithLabel: {
    paddingBottom: LABEL_HEIGHT + 4,
  },
  selectedItem: {
    zIndex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  // Centrée sous la pastille, peut déborder sur les côtés.
  labelWrap: {
    position: "absolute",
    left: -60,
    right: -60,
    alignItems: "center",
  },
  label: {
    height: LABEL_HEIGHT,
    lineHeight: LABEL_HEIGHT,
    paddingHorizontal: Spacing.sm,
    borderRadius: LABEL_HEIGHT / 2,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnPrimary,
    backgroundColor: Colors.text,
  },
});
