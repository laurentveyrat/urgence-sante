import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

export default function CreateAccountScreen() {
  // --------------------- STATES ------------------
  const [numeroSecu, setNumeroSecu] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --------------------- JSX ------------------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <TextInput
        placeholder="N° Sécurité Sociale"
        value={numeroSecu}
        onChangeText={(value) => setNumeroSecu(value)}
      />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log("Clic sur VALIDER")}
      >
        <Text style={styles.buttonText}>VALIDER</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    // fontSize: "25 px",
    fontWeight: "bold",
  },
});
