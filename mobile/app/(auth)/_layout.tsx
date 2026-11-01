import { Stack } from "expo-router";

// Écran d'entrée du groupe : c'est lui qu'on atteint quand la garde du layout
// racine renvoie vers (auth) (déconnexion, session expirée). Sans ça, Expo
// Router peut ouvrir un autre écran du groupe (mot de passe oublié, inscription).
export const unstable_settings = {
  initialRouteName: "login",
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
