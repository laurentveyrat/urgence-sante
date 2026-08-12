import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// -------------------------- DATA -------------------------
const PROFILES = [
  "Bébé",
  "Enfant",
  "Adulte",
  "Personne âgée",
  "Mal. Chronique",
];

export default function FindHospitalsScreen({ navigation }) {
  // -------------------------- STATES -------------------------

  const [selectedProfile, setSelectedProfile] = useState("Enfant");
  const [search, setSearch] = useState("");
  const [symptoms, setSymptoms] = useState([
    "Toux",
    "Fièvre",
    "Vertige",
    "Nausées",
    "Diarrhée",
  ]);
  // -------------------------- FUNCTIONS -------------------------
  const removeSymptom = (item) => {
    setSymptoms((prev) => prev.filter((s) => s !== item));
  };

  const addSymptom = () => {
    if (search.trim() && !symptoms.includes(search.trim())) {
      setSymptoms((prev) => [...prev, search.trim()]);
    }
    setSearch("");
  };

  // -------------------------- JSX -------------------------
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Profil :</Text>
      <View style={styles.pillRow}>
        {PROFILES.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pill, selectedProfile === p && styles.pillSelected]}
            onPress={() => setSelectedProfile(p)}
          >
            <Text style={styles.pillText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Symptômes :</Text>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={addSymptom}
        />
        <Ionicons name="search" size={20} color="#000" />
      </View>
      <View style={styles.chipRow}>
        {symptoms.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.chip}
            onPress={() => removeSymptom(s)}
          >
            <Ionicons name="close-circle-outline" size={18} color="#000" />
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => {
          navigation.navigate("HospitalsMapScreen", {
            profile: selectedProfile,
            symptoms,
          });
        }}
      >
        <Text style={styles.mainButtonText}>TROUVER LES HÔPITAUX</Text>
      </TouchableOpacity>
    </View>
  );
}

// -------------------------- STYLE -------------------------
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  pillSelected: { backgroundColor: "#7A0C25" },
  pillText: { color: "#fff", fontWeight: "600" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipText: { fontSize: 15 },
  mainButton: {
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 40,
  },
  mainButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  tabItem: { alignItems: "center" },
  tabLabel: { fontSize: 11, marginTop: 2 },
});
