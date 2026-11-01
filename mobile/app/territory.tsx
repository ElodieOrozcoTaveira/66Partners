import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../src/components/ui/Button";
import { ErrorState, LoadingState } from "../src/components/ui/StateViews";
import { getBrand, type Brand } from "../src/constants/brands";
import { Colors, Radius, Shadow, Spacing, Typography } from "../src/constants/theme";
import { useBrandStyles } from "../src/context/BrandContext";
import { useTerritory } from "../src/context/TerritoryContext";
import { getApiErrorMessage } from "../src/services/api";
import type { Territory } from "../src/types/domain";

/**
 * Choix du territoire actif parmi ceux du compte, et adhésion à un autre
 * territoire ouvert. Le territoire principal (isDefault) ne change jamais ici,
 * comme sur le web.
 */
export default function TerritoryScreen() {
  const styles = useBrandStyles(makeStyles);
  const {
    territories,
    activeTerritory,
    joinableTerritories,
    setActiveTerritory,
    joinTerritory,
    isLoading,
    error,
    refreshTerritories,
  } = useTerritory();
  const [joining, setJoining] = useState<string | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) {
    return <ErrorState message="Impossible de charger tes territoires." onRetry={refreshTerritories} />;
  }

  const choose = (territory: Territory) => {
    setActiveTerritory(territory.code);
    router.back();
  };

  const join = async (territory: Territory) => {
    setJoining(territory.code);
    try {
      await joinTerritory(territory.code);
      setActiveTerritory(territory.code);
      router.back();
    } catch (err) {
      Alert.alert("Impossible de rejoindre", getApiErrorMessage(err, "Réessaie dans un instant."));
    } finally {
      setJoining(null);
    }
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        Mes territoires
      </Text>
      <View style={styles.list} accessibilityRole="radiogroup">
        {territories.map((territory) => {
          const selected = territory.code === activeTerritory?.code;
          return (
            <Pressable
              key={territory.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${territory.name}, ${territory.brandName}${territory.isDefault ? ", territoire principal" : ""}`}
              onPress={() => choose(territory)}
              style={({ pressed }) => [styles.item, selected && styles.itemSelected, pressed && styles.pressed]}
            >
              <TerritoryLogo code={territory.code} />
              <View style={styles.flex}>
                <Text style={styles.name}>{territory.name}</Text>
                <Text style={styles.caption}>
                  {territory.brandName}
                  {territory.isDefault ? " · Principal" : ""}
                </Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={24} color={getBrand(territory.code).primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      {joinableTerritories.length > 0 ? (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Rejoindre un territoire
          </Text>
          <View style={styles.list}>
            {joinableTerritories.map((territory) => (
              <View key={territory.id} style={styles.item}>
                <TerritoryLogo code={territory.code} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{territory.name}</Text>
                  <Text style={styles.caption}>{territory.brandName}</Text>
                </View>
                <Button
                  label="Rejoindre"
                  variant="secondary"
                  loading={joining === territory.code}
                  disabled={joining !== null}
                  onPress={() => join(territory)}
                  style={styles.joinButton}
                />
              </View>
            ))}
          </View>
          <Text style={styles.caption}>
            Rejoindre un territoire ne change pas ton territoire principal.
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

function TerritoryLogo({ code }: { code: string }) {
  const styles = useBrandStyles(makeStyles);
  return (
    <Image source={getBrand(code).logo} resizeMode="contain" style={styles.logo} accessible={false} />
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    flex: {
      flex: 1,
    },
    pressed: {
      opacity: 0.75,
    },
    sectionTitle: {
      ...Typography.subheading,
      fontSize: 18,
      marginTop: Spacing.md,
    },
    list: {
      gap: Spacing.sm,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      minHeight: 72,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      ...Shadow.card,
    },
    itemSelected: {
      borderColor: brand.primary,
      borderWidth: 2,
    },
    logo: {
      width: 72,
      height: 42,
    },
    name: {
      ...Typography.subheading,
    },
    caption: {
      ...Typography.caption,
    },
    joinButton: {
      minHeight: 40,
      paddingHorizontal: Spacing.md,
    },
  });
