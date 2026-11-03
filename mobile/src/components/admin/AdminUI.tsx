import type { ComponentProps, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

import type { Brand } from "../../constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../../constants/theme";
import { useBrand, useBrandStyles } from "../../context/BrandContext";
import { useAdmin } from "../../context/AdminContext";
import { haptics } from "../../lib/haptics";
import { FALLBACK_COLOR, formatNumber } from "../../lib/adminLabels";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** Carte blanche avec titre (équivalent du Panel du web). */
export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.panelTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.caption}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText} accessibilityRole="header">
        {title}
      </Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

/** Grille de 2 colonnes pour les petites tuiles chiffrées. */
export function StatGrid({ children }: { children: ReactNode }) {
  const styles = useBrandStyles(makeStyles);
  return <View style={styles.grid}>{children}</View>;
}

/** Tuile chiffrée : valeur, libellé, évolution sur la période (optionnelle). */
export function MiniStat({
  icon,
  color,
  label,
  value,
  suffix,
  hint,
  deltaPct,
  onPress,
}: {
  icon?: IconName;
  color?: string;
  label: string;
  value: number | string | null;
  suffix?: string;
  hint?: string;
  deltaPct?: number;
  onPress?: () => void;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const tint = color ?? brand.primary;
  const display = value === null ? "–" : typeof value === "number" ? formatNumber(value) : value;

  const content = (
    <>
      <View style={styles.miniHead}>
        {icon ? (
          <View style={[styles.miniIcon, { backgroundColor: `${tint}1F` }]}>
            <Ionicons name={icon} size={16} color={tint} />
          </View>
        ) : null}
        {typeof deltaPct === "number" ? <Delta value={deltaPct} /> : null}
        {onPress ? <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} style={styles.miniChevron} /> : null}
      </View>
      <Text style={styles.miniValue} numberOfLines={1} adjustsFontSizeToFit>
        {display}
        {suffix && value !== null ? <Text style={styles.miniSuffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.miniLabel} numberOfLines={2}>
        {label}
      </Text>
      {hint ? (
        <Text style={styles.miniHint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.mini}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} : ${display}`}
      onPress={onPress}
      style={({ pressed }) => [styles.mini, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function Delta({ value }: { value: number }) {
  const styles = useBrandStyles(makeStyles);
  const up = value > 0;
  const flat = value === 0;
  const color = flat ? Colors.textSecondary : up ? Colors.success : Colors.danger;
  return (
    <View style={[styles.delta, { backgroundColor: flat ? Colors.surface : up ? Colors.successSoft : Colors.dangerSoft }]}>
      <Ionicons name={flat ? "remove" : up ? "trending-up" : "trending-down"} size={12} color={color} />
      <Text style={[styles.deltaText, { color }]}>
        {up ? "+" : ""}
        {value}%
      </Text>
    </View>
  );
}

export function StatusBadge({ label, color }: { label: string; color: string }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Barre empilée + légende (statuts, niveaux). */
export function StackedBar({ segments }: { segments: Segment[] }) {
  const styles = useBrandStyles(makeStyles);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <View style={styles.stacked}>
      <View style={styles.stackedTrack}>
        {total === 0 ? null : (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <View key={segment.key} style={{ flex: segment.value, backgroundColor: segment.color }} />
            ))
        )}
      </View>
      <View style={styles.legend}>
        {segments.map((segment) => (
          <View key={segment.key} style={styles.legendItem}>
            <View style={[styles.badgeDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendText}>
              {segment.label} <Text style={styles.legendValue}>{formatNumber(segment.value)}</Text>
              {total > 0 ? ` · ${Math.round((segment.value / total) * 100)}%` : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export interface BarItem {
  key: string;
  label: string;
  value: number;
  color?: string;
  onPress?: () => void;
}

/** Classement horizontal (sports, villes, membres). */
export function BarList({ items, showPercent = false, empty = "Aucune donnée pour l'instant." }: {
  items: BarItem[];
  showPercent?: boolean;
  empty?: string;
}) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  if (items.length === 0) return <Text style={styles.caption}>{empty}</Text>;
  const max = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.barList}>
      {items.map((item) => {
        const row = (
          <>
            <View style={styles.barHead}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={styles.barValue}>
                {formatNumber(item.value)}
                {showPercent && total > 0 ? ` · ${Math.round((item.value / total) * 100)}%` : ""}
              </Text>
              {item.onPress ? <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} /> : null}
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: item.color ?? brand.primary },
                ]}
              />
            </View>
          </>
        );
        return item.onPress ? (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}, ${item.value}`}
            onPress={item.onPress}
            style={({ pressed }) => [styles.barRow, pressed && styles.pressed]}
          >
            {row}
          </Pressable>
        ) : (
          <View key={item.key} style={styles.barRow}>
            {row}
          </View>
        );
      })}
    </View>
  );
}

/** Pastilles horizontales à choix unique (période, filtres). */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useBrandStyles(makeStyles);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value || "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Filtre par territoire, partagé entre les onglets admin (comme le web). */
export function TerritoryFilter() {
  const { territory, setTerritory, territories } = useAdmin();
  if (territories.length === 0) return null;
  const options = [{ value: "", label: "Tous" }].concat(
    territories.map((t) => ({ value: t.code, label: t.isActive ? t.code : `${t.code} (inactif)` }))
  );
  return <ChipRow options={options} value={territory} onChange={setTerritory} />;
}

/** Courbe des inscriptions (même données que le graphique du web). */
export function EvolutionChart({ points }: { points: { date: string; count: number }[] }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const width = 320;
  const height = 150;
  const padX = 12;
  const padTop = 18;
  const padBottom = 22;

  if (points.length === 0) return <Text style={styles.caption}>Aucune donnée pour l’instant.</Text>;

  const max = Math.max(...points.map((p) => p.count), 1);
  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: padX + i * stepX,
    y: padTop + (1 - p.count / max) * (height - padTop - padBottom),
    ...p,
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x},${height - padBottom} L${coords[0].x},${height - padBottom} Z`;
  const shortDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} accessibilityLabel="Évolution des inscriptions">
      <Line x1={padX} x2={width - padX} y1={height - padBottom} y2={height - padBottom} stroke={Colors.border} />
      <Path d={area} fill={brand.primary} fillOpacity={0.12} />
      <Path d={line} stroke={brand.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <G key={c.date}>
          <Circle cx={c.x} cy={c.y} r={3.5} fill={Colors.background} stroke={brand.primary} strokeWidth={2} />
          <SvgText x={c.x} y={c.y - 7} fontSize={9} fontWeight="700" fill={Colors.text} textAnchor="middle">
            {c.count}
          </SvgText>
          {i % 2 === 0 || i === coords.length - 1 ? (
            <SvgText x={c.x} y={height - 6} fontSize={9} fill={Colors.textSecondary} textAnchor="middle">
              {shortDate(c.date)}
            </SvgText>
          ) : null}
        </G>
      ))}
    </Svg>
  );
}

const DONUT_COLORS = ["#C62828", "#F08A3C", "#EDA100", "#2563eb", "#16a34a", "#7c3aed", "#0891b2", "#db2777"];

/** Anneau de répartition (inscrits par territoire). */
export function Donut({ items, total }: { items: { key: string; label: string; value: number }[]; total: number }) {
  const styles = useBrandStyles(makeStyles);
  const size = 140;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const sum = items.reduce((acc, item) => acc + item.value, 0);
  let offset = 0;

  return (
    <View style={styles.donutRow}>
      <View>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.surface} strokeWidth={stroke} fill="none" />
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {sum > 0
              ? items.map((item, i) => {
                  const length = (item.value / sum) * circumference;
                  const dash = (
                    <Circle
                      key={item.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                      strokeWidth={stroke}
                      fill="none"
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += length;
                  return dash;
                })
              : null}
          </G>
        </Svg>
        <View style={styles.donutCenter} pointerEvents="none">
          <Text style={styles.donutValue}>{formatNumber(total)}</Text>
          <Text style={styles.caption}>inscrits</Text>
        </View>
      </View>
      <View style={styles.donutLegend}>
        {items.length === 0 ? <Text style={styles.caption}>Aucun inscrit.</Text> : null}
        {items.map((item, i) => (
          <View key={item.key} style={styles.legendItem}>
            <View style={[styles.badgeDot, { backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] ?? FALLBACK_COLOR }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {item.label} <Text style={styles.legendValue}>{formatNumber(item.value)}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Ligne "clé : valeur" des fiches détaillées. */
export function Fact({ label, value, onPress }: { label: string; value: ReactNode; onPress?: () => void }) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      {onPress ? (
        <Pressable accessibilityRole="link" onPress={onPress} hitSlop={6} style={styles.factValueBox}>
          <Text style={[styles.factValue, { color: brand.primary }]}>{value}</Text>
        </Pressable>
      ) : (
        <View style={styles.factValueBox}>
          {typeof value === "string" || typeof value === "number" ? (
            <Text style={styles.factValue}>{value}</Text>
          ) : (
            value
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },
    caption: { ...Typography.caption },
    panel: {
      padding: Spacing.lg,
      gap: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    panelTitle: { ...Typography.subheading, fontSize: 17 },
    sectionTitle: { gap: 2, marginTop: Spacing.sm },
    sectionTitleText: { ...Typography.heading },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
    mini: {
      width: "48.5%",
      flexGrow: 1,
      padding: Spacing.md,
      gap: 2,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    miniHead: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, minHeight: 4, marginBottom: 4 },
    miniIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    miniChevron: { marginLeft: "auto" },
    miniValue: { fontSize: 24, fontWeight: "800", color: Colors.text },
    miniSuffix: { fontSize: 15, fontWeight: "700", color: Colors.textSecondary },
    miniLabel: { ...Typography.label, fontSize: 13 },
    miniHint: { ...Typography.caption, fontSize: 12, lineHeight: 16 },
    delta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      marginLeft: "auto",
    },
    deltaText: { fontSize: 11, fontWeight: "700" },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      alignSelf: "flex-start",
    },
    badgeDot: { width: 8, height: 8, borderRadius: 4 },
    badgeText: { fontSize: 12, fontWeight: "700" },
    stacked: { gap: Spacing.sm },
    stackedTrack: {
      flexDirection: "row",
      height: 12,
      borderRadius: Radius.pill,
      overflow: "hidden",
      backgroundColor: Colors.surface,
    },
    legend: { flexDirection: "row", flexWrap: "wrap", columnGap: Spacing.md, rowGap: Spacing.xs },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
    legendText: { fontSize: 13, color: Colors.textSecondary, flexShrink: 1 },
    legendValue: { fontWeight: "700", color: Colors.text },
    barList: { gap: Spacing.sm },
    barRow: { gap: 4 },
    barHead: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    barLabel: { ...Typography.label, fontSize: 13, flex: 1 },
    barValue: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
    barTrack: { height: 8, borderRadius: Radius.pill, backgroundColor: Colors.surface, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: Radius.pill },
    chips: { gap: Spacing.sm, paddingVertical: 2 },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    chipActive: { borderColor: brand.primary, backgroundColor: brand.primary },
    chipText: { fontSize: 13, fontWeight: "600", color: Colors.text },
    chipTextActive: { color: Colors.textOnPrimary },
    donutRow: { flexDirection: "row", alignItems: "center", gap: Spacing.lg },
    donutCenter: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    donutValue: { fontSize: 22, fontWeight: "800", color: Colors.text },
    donutLegend: { flex: 1, gap: Spacing.xs },
    fact: {
      flexDirection: "row",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    factLabel: { ...Typography.caption, fontSize: 14, width: 120 },
    factValueBox: { flex: 1 },
    factValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  });
