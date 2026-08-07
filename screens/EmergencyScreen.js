import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function EmergencyScreen({ navigation }) {
  return (
 <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="chevron-left" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Urgence Absolue</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.8}
          >
          <Text style={styles.buttonText}>Secouriste de Proximité</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL('tel:15')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Appel SAMU</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#1b1b1b',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});