import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Urgence Santé</Text>

      <View style={styles.buttonGroup}>
        <View style={styles.buttonBlock}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => navigation.navigate("Emergency")}
          >
            <Text style={styles.emergencyButtonText}>URGENCE ABSOLUE</Text>
          </TouchableOpacity>
          <Text style={styles.buttonSubtitle}>
            Crise cardiaque, malaise, accident de la route...
          </Text>
        </View>

        <View style={styles.buttonBlock}>
          <TouchableOpacity
            style={styles.hospitalButton}
            onPress={() => navigation.navigate("FindHospitals")}
          >
            <Text style={styles.hospitalButtonText}>TROUVER UN HÔPITAL</Text>
          </TouchableOpacity>
          <Text style={styles.buttonSubtitle}>
            Temps d'attente en temps réel
          </Text>
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 24,
  },
  buttonGroup: {
    marginTop: 100,
  },
  buttonBlock: {
    marginBottom: 40,
  },
  emergencyButton: {
    backgroundColor: "#7A0C25",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emergencyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  hospitalButton: {
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  hospitalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },
});
