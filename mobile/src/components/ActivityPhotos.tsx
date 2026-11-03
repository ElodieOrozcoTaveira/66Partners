import { useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "./ui/Text";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import type { Brand } from "../constants/brands";
import { Colors, Radius, Spacing, Typography } from "../constants/theme";
import { useBrand, useBrandStyles } from "../context/BrandContext";
import { useAsync } from "../hooks/useAsync";
import { toAvatarFile } from "../lib/avatarFile";
import { formatRelativeTime } from "../lib/date";
import { haptics } from "../lib/haptics";
import { deleteActivityPhoto, getActivityPhotos, uploadActivityPhoto } from "../services/activities.service";
import { getApiErrorMessage, resolveMediaUrl } from "../services/api";
import type { ActivityPhoto } from "../types/domain";
import { Avatar } from "./ui/Avatar";
import { useModeration } from "../hooks/useModeration";

// Pas de recadrage imposé (photos de groupe, paysages) ; compression pour
// rester sous la limite serveur de 5 Mo.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };

interface ActivityPhotosProps {
  activityId: string;
  /** L'activité a commencé : l'ajout de photos est ouvert (règle serveur). */
  hasEnded: boolean;
  currentUserId: string;
}

/**
 * Photos souvenirs d'une activité, visibles par l'organisateur et les
 * participants acceptés (même règle et mêmes routes que le web).
 */
export function ActivityPhotos({ activityId, hasEnded, currentUserId }: ActivityPhotosProps) {
  const brand = useBrand();
  const styles = useBrandStyles(makeStyles);
  const [isUploading, setIsUploading] = useState(false);
  const [viewed, setViewed] = useState<ActivityPhoto | null>(null);
  const { showMenu, reportModal } = useModeration();

  // La visionneuse est fermée d'abord : iOS ne superpose pas deux fenêtres modales.
  const openPhotoMenu = (photo: ActivityPhoto) => {
    setViewed(null);
    setTimeout(
      () =>
        showMenu({
          title: `Photo de ${photo.authorPseudo}`,
          report: { context: "PHOTO", targetId: photo.id, label: "Signaler cette photo" },
          block: { userId: photo.uploaderId, pseudo: photo.authorPseudo },
          onBlocked: refresh,
        }),
      400
    );
  };

  const photos = useAsync(() => getActivityPhotos(activityId), [activityId], {
    enabled: hasEnded,
    errorMessage: "Impossible de charger les photos.",
  });
  const { setData, refresh } = photos;

  const upload = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    const file = toAvatarFile(result.assets[0]);
    if ("error" in file) {
      Alert.alert("Photo refusée", file.error);
      return;
    }
    setIsUploading(true);
    try {
      await uploadActivityPhoto(activityId, { ...file, name: file.name.replace("avatar", "photo") });
      haptics.success();
      refresh();
    } catch (err) {
      Alert.alert("Envoi impossible", getApiErrorMessage(err, "La photo n'a pas pu être envoyée."));
    } finally {
      setIsUploading(false);
    }
  };

  const fromLibrary = async () => upload(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Appareil photo non autorisé",
        "Autorise l'accès à l'appareil photo dans les réglages du téléphone, ou choisis une photo existante."
      );
      return;
    }
    await upload(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const addPhoto = () => {
    if (isUploading) return;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: "Ajouter une photo", options: ["Annuler", "Choisir dans la photothèque", "Prendre une photo"], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) void fromLibrary();
          if (index === 2) void fromCamera();
        }
      );
      return;
    }
    Alert.alert("Ajouter une photo", undefined, [
      { text: "Choisir dans la galerie", onPress: () => void fromLibrary() },
      { text: "Prendre une photo", onPress: () => void fromCamera() },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const confirmDelete = (photo: ActivityPhoto) =>
    Alert.alert("Supprimer cette photo ?", "Elle ne sera plus visible par le groupe.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setViewed(null);
          // Retrait immédiat, rechargé si le serveur refuse.
          setData((current) => current?.filter((item) => item.id !== photo.id));
          try {
            await deleteActivityPhoto(photo.id);
          } catch (err) {
            Alert.alert("Suppression impossible", getApiErrorMessage(err, "Impossible de supprimer la photo."));
            refresh();
          }
        },
      },
    ]);

  const list = photos.data ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Photos{list.length ? ` (${list.length})` : ""}
        </Text>
        {hasEnded ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter une photo"
            onPress={addPhoto}
            disabled={isUploading}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={brand.primary} />
            ) : (
              <Ionicons name="add" size={18} color={brand.primary} />
            )}
            <Text style={styles.addLabel}>{isUploading ? "Envoi…" : "Ajouter"}</Text>
          </Pressable>
        ) : null}
      </View>

      {!hasEnded ? (
        <Text style={styles.caption}>Les photos seront disponibles après l’activité.</Text>
      ) : photos.isLoading ? (
        <ActivityIndicator color={brand.primary} style={styles.loader} />
      ) : photos.error ? (
        <Pressable accessibilityRole="button" onPress={refresh}>
          <Text style={styles.caption}>{photos.error} Touche pour réessayer.</Text>
        </Pressable>
      ) : list.length === 0 ? (
        <Text style={styles.caption}>Aucune photo pour l’instant. Sois le premier à en ajouter !</Text>
      ) : (
        <View style={styles.grid}>
          {list.map((photo) => (
            <Pressable
              key={photo.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo ajoutée par ${photo.authorPseudo}`}
              onPress={() => setViewed(photo)}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <Image
                source={resolveMediaUrl(photo.url)}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={viewed !== null} animationType="fade" onRequestClose={() => setViewed(null)}>
        {/* Un Modal sort de l'arbre principal : il lui faut son propre fournisseur de marges. */}
        <SafeAreaProvider>
        {viewed ? (
          <View style={styles.viewer}>
            <Image source={resolveMediaUrl(viewed.url)} style={StyleSheet.absoluteFill} contentFit="contain" />
            <SafeAreaView edges={["top"]} style={styles.viewerTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={() => setViewed(null)}
                hitSlop={10}
                style={styles.viewerButton}
              >
                <Ionicons name="close" size={24} color={Colors.textOnPrimary} />
              </Pressable>
              {viewed.uploaderId === currentUserId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer la photo"
                  onPress={() => confirmDelete(viewed)}
                  hitSlop={10}
                  style={styles.viewerButton}
                >
                  <Ionicons name="trash-outline" size={22} color={Colors.textOnPrimary} />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Signaler la photo ou bloquer son auteur"
                  onPress={() => openPhotoMenu(viewed)}
                  hitSlop={10}
                  style={styles.viewerButton}
                >
                  <Ionicons name="flag-outline" size={21} color={Colors.textOnPrimary} />
                </Pressable>
              )}
            </SafeAreaView>
            <SafeAreaView edges={["bottom"]} style={styles.viewerBottom}>
              <Avatar uri={viewed.authorAvatar} name={viewed.authorPseudo} size={32} />
              <Text style={styles.viewerText} numberOfLines={1}>
                {viewed.authorPseudo} · {formatRelativeTime(viewed.createdAt)}
              </Text>
            </SafeAreaView>
          </View>
        ) : null}
        </SafeAreaProvider>
      </Modal>
      {reportModal}
    </View>
  );
}

const makeStyles = (brand: Brand) =>
  StyleSheet.create({
    section: { marginTop: Spacing.xl, gap: Spacing.md },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    title: { ...Typography.subheading, fontSize: 18 },
    pressed: { opacity: 0.7 },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      minHeight: 36,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.pill,
      backgroundColor: brand.primarySoft,
    },
    addLabel: { fontSize: 14, fontWeight: "700", color: brand.primary },
    caption: { ...Typography.caption, fontSize: 14 },
    loader: { paddingVertical: Spacing.lg },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
    tile: {
      width: "32.5%",
      aspectRatio: 1,
      borderRadius: Radius.sm,
      overflow: "hidden",
      backgroundColor: Colors.surface,
    },
    viewer: { flex: 1, backgroundColor: "#000" },
    viewerTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
    },
    viewerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginTop: Spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    viewerBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    viewerText: { flex: 1, color: Colors.textOnPrimary, fontSize: 14, fontWeight: "600" },
  });
