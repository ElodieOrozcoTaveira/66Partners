import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>

      <View style={styles.card}>
        <Text style={styles.pseudo}>
          {user?.pseudo ?? "Utilisateur"}
        </Text>

        <Text style={styles.email}>
          {user?.email ?? ""}
        </Text>

        {user?.city ? (
          <Text style={styles.city}>{user.city}</Text>
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.pressed,
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },

  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    marginBottom: 30,
  },

  pseudo: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },

  email: {
    fontSize: 15,
    color: "#666",
  },

  city: {
    fontSize: 15,
    color: "#666",
    marginTop: 6,
  },

  logoutButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d32f2f",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    color: "#d32f2f",
    fontSize: 16,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.6,
  },
});