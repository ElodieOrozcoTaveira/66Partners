import { StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { Image } from "expo-image";

import { Colors } from "../../constants/theme";
import { resolveMediaUrl } from "../../services/api";
import { useBrandStyles } from "../../context/BrandContext";
import type { Brand } from "../../constants/brands";

interface AvatarProps {
  uri: string | null | undefined;
  name: string | null | undefined;
  size?: number;
}

/** Photo de profil, ou initiale du pseudo si aucune photo. */
export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const styles = useBrandStyles(makeStyles);
  const source = resolveMediaUrl(uri);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (source) {
    return (
      <Image
        source={source}
        style={[styles.image, dimension]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }

  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <View style={[styles.placeholder, dimension]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
  image: {
    backgroundColor: Colors.surface,
  },
  placeholder: {
    backgroundColor: brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: brand.primary,
    fontWeight: "800",
  },
});
