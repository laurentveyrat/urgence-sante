import { StyleSheet, Text, View } from 'react-native';


const BACKEND_URL = 'http://192.168.100.130:3000';


export default function HistoryScreen({ navigation }) {

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Historique</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
  },
});
