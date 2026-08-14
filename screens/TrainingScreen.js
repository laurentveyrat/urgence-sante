import { Alert, Linking, ScrollView, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const FORMATIONS = [
  {
    id: 'psc',
    title: 'PSC - Premiers Secours Citoyen :',
    url: 'https://www.protection-civile.org/formations-psc-premier-secours/psc/',
    description:
      "La formation PSC (dès 10 ans) prépare à réagir face à un malaise ou un accident, au travail, en extérieur ou à domicile, et inclut l'utilisation d'un défibrillateur. Certificat envoyé par mail (PDF sécurisé) en fin de formation.",
  },
  {
    id: 'pse1',
    title: 'PSE1 - Premiers Secours en Équipe de niveau 1 :',
    url: 'https://www.protection-civile.org/formations-psc-premier-secours/pse1/',
    description:
      'La formation PSE1 est ouverte à tous et constitue le prérequis de formations comme le BNSSA (Code CPF : 236482). Merci de vous présenter 15 minutes avant le début.',
  },
  {
    id: 'pse2',
    title: 'PSE2 - Premiers Secours en Équipe de niveau 2 :',
    url: 'https://www.protection-civile.org/formations-psc-premier-secours/pse2/',
    description:
      "La formation PSE2 s'adresse aux titulaires du PSE1 souhaitant exercer (professionnel, bénévole ou volontaire) au sein d'un organisme public ou d'une association agréée de sécurité civile. Merci de vous présenter 15 minutes avant le début.",
  },
  {
    id: 'sst',
    title: 'SST - Sauvetage Secourisme du Travail :',
    url: 'https://www.protection-civile.org/formations-professionnelles/formation-sst/',
    description:
      'La formation SST vise à former des sauveteurs secouristes du travail dans les établissements et chantiers, et à promouvoir la prévention des risques professionnels. Formation axée sur la pratique : gestes de secours et prévention.',
  },
];

const handlePress = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Lien indisponible', "Impossible d'ouvrir cette page.");
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Erreur', "Une erreur est survenue lors de l'ouverture du lien.");
  }
};

export default function TrainingScreen({ navigation }) {
  const formationsDisponibles = FORMATIONS.map((formation) => {
    return (
      <TouchableOpacity
        key={formation.id}
        style={styles.formation}
        onPress={() => handlePress(formation.url)}
        activeOpacity={0.7}
      >
        <Text style={styles.formationTitle}>{formation.title}</Text>
        <Text style={styles.formationDescription}>{formation.description}</Text>
        <View style={styles.seeMoreButton}>
          <Text style={styles.seeMoreText}>En savoir plus</Text>
          <FontAwesome5 name="chevron-right" size={13} color="#7A0C25" />
        </View>
      </TouchableOpacity>
    );
  });

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Formations Disponibles:</Text>
        {formationsDisponibles}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginTop: 16,
    marginBottom: 20,
  },
  formation: {
    marginBottom: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 6,
  },
  formationDescription: {
    fontSize: 17,
    lineHeight: 25,
    color: '#4a4a4a',
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingTop: 12,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#7A0C25',
  },
});
