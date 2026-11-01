import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useBrandStyles } from "../context/BrandContext";
import { useAvatarPicker } from "../hooks/useAvatarPicker";
import { Avatar } from "./ui/Avatar";

/** Photo de profil de l'utilisateur connecté, avec badge pour la changer (maquette). */
export function AvatarEditor({ size = 96 }: { size?: number }) {
  const styles = useBrandStyles(makeStyles);
  const { user } = useAuth();
  const { pickAvatar, isUploading } = useAvatarPicker();
  const badge = Math.round(size * 0.34);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Changer ma photo de profil"
      accessibilityState={{ busy: isUploading }}
      onPress={pickAvatar}
      disabled={isUploading}
      hitSlop={6}
    >
      <Avatar uri={user?.avatar} name={user?.pseudo} size={size} />
      {isUploading ? (
        <View style={[styles.overlay, { borderRadius: size / 2 }]}>
          <ActivityIndicator color={Colors.textOnPrimary} />
        </View>
      ) : null}
      <View style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
        <Ionicons name="camera" size={badge * 0.55} color={Colors.textOnPrimary} />
      </View>
    </Pressable>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    badge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: Colors.background,
      backgroundColor: brand.primary,
      backgroundImage: brand.gradientDiagonal,
    },
  });
