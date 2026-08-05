import { StyleSheet, Text, View } from "react-native";

export default function FindHospitalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Find Hospitals</Text>
      <Text style={styles.text}>Profil</Text>
      <Text style={styles.text}>Symptômes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
  },
});
