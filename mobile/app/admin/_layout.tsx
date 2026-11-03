import { Stack } from "expo-router";

import { CloseAdminButton } from "../../src/components/admin/AdminHeaderButtons";
import { LoadingState } from "../../src/components/ui/StateViews";
import { Colors } from "../../src/constants/theme";
import { useAdmin } from "../../src/context/AdminContext";
import { useBrand } from "../../src/context/BrandContext";

/**
 * Espace administrateur : mêmes données que /admin sur le site web, protégées
 * par le mot de passe admin (indépendant du compte utilisateur).
 */
export default function AdminLayout() {
  const brand = useBrand();
  const { isAdmin, isRestoring } = useAdmin();

  if (isRestoring) return <LoadingState />;

  return (
    <Stack
      screenOptions={{
        headerTintColor: brand.primary,
        headerTitleStyle: { color: Colors.text },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: Colors.surface },
      }}
    >
      {/* Jeton expiré ou déconnexion admin : retour automatique au mot de passe. */}
      <Stack.Protected guard={!isAdmin} redirectTo="/admin">
        <Stack.Screen
          name="login"
          options={{ title: "Espace administrateur", headerLeft: () => <CloseAdminButton /> }}
        />
      </Stack.Protected>

      <Stack.Protected guard={isAdmin} redirectTo="/admin/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="user/[id]" options={{ title: "Fiche membre" }} />
        <Stack.Screen name="activity/[id]" options={{ title: "Fiche activité" }} />
      </Stack.Protected>
    </Stack>
  );
}
