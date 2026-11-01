import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import SplashTransition from "../src/components/SplashTransition";
import { Colors } from "../src/constants/theme";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { TerritoryProvider } from "../src/context/TerritoryContext";
import { NotificationsProvider } from "../src/context/NotificationsContext";
import { TerritoryBrandProvider, useBrand } from "../src/context/BrandContext";

// L'écran natif reste affiché jusqu'à ce que la photo de démarrage soit
// prête (cf. SplashTransition) : pas d'écran blanc entre les deux.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const brand = useBrand();
  const { isAuthenticated, isLoading } = useAuth();

  // Session en cours de restauration : l'animation de démarrage couvre l'écran.
  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: brand.primary,
        headerTitleStyle: { color: Colors.text },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      {/* Les gardes sont réévaluées à chaque changement de session : une
          déconnexion (ou un jeton expiré) renvoie automatiquement au login
          et purge l'historique des écrans protégés.
          redirectTo est indispensable : sans lui, le routeur vise l'accueil
          ("/"), lui-même protégé, et affiche "Page could not be found". */}
      <Stack.Protected guard={!isAuthenticated} redirectTo="/(tabs)">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated} redirectTo="/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="activity/[id]" options={{ title: "Activité" }} />
        <Stack.Screen name="activity/edit/[id]" options={{ title: "Modifier l'activité" }} />
        <Stack.Screen name="conversation/[activityId]" options={{ title: "Discussion" }} />
        <Stack.Screen name="profile/edit" options={{ title: "Modifier mon profil" }} />
        <Stack.Screen name="profile/activities" options={{ title: "Mes activités" }} />
        <Stack.Screen name="profile/sports" options={{ title: "Mes sports" }} />
        <Stack.Screen name="settings" options={{ title: "Paramètres" }} />
        <Stack.Screen name="territory" options={{ title: "Mon territoire" }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        <Stack.Screen name="user/[id]" options={{ title: "Profil" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationsProvider>
      <TerritoryProvider>
        {/* Couleurs de marque du territoire actif (66, 34, 11…). */}
        <TerritoryBrandProvider>
          <SplashTransition>
            <StatusBar style="dark" />
            <RootNavigator />
          </SplashTransition>
        </TerritoryBrandProvider>
      </TerritoryProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
