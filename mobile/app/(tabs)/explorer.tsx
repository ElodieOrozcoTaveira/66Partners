import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { getSports, Sport } from "@/services/sports.service";

export default function ExplorerScreen() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSports() {
      try {
        const data = await getSports();
        setSports(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de récupérer les sports.");
      } finally {
        setLoading(false);
      }
    }

    loadSports();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 80 }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 20 }}>
        Sports
      </Text>

      {sports.map((sport) => (
        <Text key={sport.id} style={{ fontSize: 18, marginBottom: 10 }}>
          {sport.name}
        </Text>
      ))}
    </View>
  );
}