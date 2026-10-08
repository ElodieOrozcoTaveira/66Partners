import { Redirect, Stack, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { TerritoryProvider } from "../src/context/TerritoryContext";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) {
    return null;
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <TerritoryProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </TerritoryProvider>
  );
}