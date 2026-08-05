import { StyleSheet, Text, View } from 'react-native';

export default function TrainingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Formation</Text>
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
