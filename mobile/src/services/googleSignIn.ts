import { Platform } from "react-native";

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../config/env";

type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");

/**
 * Le module natif n'existe pas dans Expo Go ni sur le web : chargement
 * paresseux pour que l'app démarre quand même (bouton Google alors masqué).
 */
let cachedModule: GoogleSigninModule | null | undefined;

function loadModule(): GoogleSigninModule | null {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require("@react-native-google-signin/google-signin") as GoogleSigninModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

let configured = false;

/** true si la connexion Google peut être proposée sur cet appareil. */
export function isGoogleSignInAvailable(): boolean {
  if (Platform.OS === "web" || !GOOGLE_WEB_CLIENT_ID) return false;
  if (Platform.OS === "ios" && !GOOGLE_IOS_CLIENT_ID) return false;
  return loadModule() !== null;
}

export class GoogleSignInError extends Error {}

/**
 * Ouvre la fenêtre de connexion Google et renvoie l'ID token à transmettre
 * au backend, ou null si l'utilisateur a annulé.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  const mod = loadModule();
  if (!mod || !isGoogleSignInAvailable()) {
    throw new GoogleSignInError("La connexion Google n'est pas disponible sur cet appareil.");
  }
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = mod;

  if (!configured) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    });
    configured = true;
  }

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    // Déconnexion préalable : permet de choisir un autre compte Google à
    // chaque fois (sinon le dernier compte utilisé est repris d'office).
    await GoogleSignin.signOut().catch(() => undefined);

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return null;

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new GoogleSignInError("Google n'a pas renvoyé d'identifiant. Réessaie.");
    }
    return idToken;
  } catch (error) {
    if (error instanceof GoogleSignInError) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleSignInError("Les services Google Play sont indisponibles sur ce téléphone.");
      }
    }
    throw new GoogleSignInError("Connexion avec Google impossible. Réessaie plus tard.");
  }
}
