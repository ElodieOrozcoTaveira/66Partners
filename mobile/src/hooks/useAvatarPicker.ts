import { useState } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../context/AuthContext";
import { toAvatarFile } from "../lib/avatarFile";
import { getApiErrorMessage } from "../services/api";
import { uploadAvatar } from "../services/user.service";

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  // Recadrage carré + compression : photo légère (bien sous la limite de 5 Mo).
  quality: 0.7,
};

/**
 * Changer sa photo de profil : photothèque (sans permission, sélecteur
 * système) ou appareil photo (permission demandée au moment du besoin).
 */
export function useAvatarPicker() {
  const { setUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    const file = toAvatarFile(result.assets[0]);
    if ("error" in file) {
      Alert.alert("Photo refusée", file.error);
      return;
    }
    setIsUploading(true);
    try {
      setUser(await uploadAvatar(file));
    } catch (err) {
      Alert.alert("Envoi impossible", getApiErrorMessage(err, "Impossible d'enregistrer ta photo."));
    } finally {
      setIsUploading(false);
    }
  };

  const fromLibrary = async () => {
    await handleResult(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  };

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Appareil photo non autorisé",
        "Autorise l'accès à l'appareil photo dans les réglages du téléphone, ou choisis une photo existante."
      );
      return;
    }
    await handleResult(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const pickAvatar = () => {
    if (isUploading) return;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Photo de profil",
          options: ["Annuler", "Choisir dans la photothèque", "Prendre une photo"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void fromLibrary();
          if (index === 2) void fromCamera();
        }
      );
      return;
    }
    Alert.alert("Photo de profil", undefined, [
      { text: "Choisir dans la galerie", onPress: () => void fromLibrary() },
      { text: "Prendre une photo", onPress: () => void fromCamera() },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  return { pickAvatar, isUploading };
}
