import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect } from 'react';


const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_ADRESS;

const FAKE_HEALTH_RECORDS = [
  {
    _id: 'demo-1',
    label: 'Chirurgie cérébrale',
    practitionerName: 'John Dorian',
    occurredAt: '2025-11-08',
  },
  {
    _id: 'demo-2',
    label: 'Greffe pulmonaire',
    practitionerName: 'Perry Cox',
    occurredAt: '2025-11-08',
  },
  {
    _id: 'demo-3',
    label: 'Transplantation cardiaque',
    practitionerName: 'Christopher Turk',
    occurredAt: '2025-10-22',
  },
  {
    _id: 'demo-4',
    label: 'Appendicectomie',
    practitionerName: 'Elliot Reid',
    occurredAt: '2025-11-22',
  },
  {
    _id: 'demo-5',
    label: 'Chirurgie cérébrale',
    practitionerName: 'Todd Quinlan',
    occurredAt: '2025-11-22',
  },
  {
    _id: 'demo-6',
    label: 'Pontage coronarien',
    practitionerName: 'Bob Kelso',
    occurredAt: '2025-10-05',
  },
  {
    _id: 'demo-7',
    label: 'Arthroscopie du genou',
    practitionerName: 'Doug Murphy',
    occurredAt: '2025-09-27',
  },
];


const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatDay(date) {
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}


// function hasValidDate(record) {
//   return Boolean(record.occurredAt) && !Number.isNaN(new Date(record.occurredAt).getTime());
// } not sure if I need this function all health records in france are sent with valid date

//sorting the dates --> decending from most recent
function groupRecords(records) {
  const sorted = [...records]
    .sort((a, b) => new Date(b.occurredAt)- new Date(a.occurredAt));
  const groups = [];

  for (const record of sorted) {
    const date = new Date(record.occurredAt);
// format year-month-day
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

// 2 groups(healthRecord) in the same day. Putting them under one date instead of repeating the date.
    const lastGroup = groups[groups.length - 1];
// if a group already exists and its date matches the date of the record I'm holding → put the record in that group
    if (lastGroup && lastGroup.key === key) {
      lastGroup.records.push(record);
    } else {
      groups.push({
        key,
        year: String(date.getFullYear()),
        label: formatDay(date),
        records: [record],
      });
    }
  }

  return groups;
}

export default function HistoryScreen({ navigation }) {
  const user = useSelector((state) => state.user.value);
  const isFocused = useIsFocused();
  const hasNss = Boolean(user.socialSecurityNumber);

  const [healthRecords, setHealthRecords] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [showNssModal, setShowNssModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  /* ================================ EFFECTS ============================== */

  /* -- isFocused: render different content based on the current focus
        (no NSS on file) --> the modal opens(true);
        hasNSS is true --> the modal stays closed  ---------------------------------------- */


  useEffect(() => {
    if (isFocused) setShowNssModal(!hasNss && !showDemo);
  }, [isFocused, hasNss, showDemo]);


  useEffect(() => {
    if (!hasNss || !user.token) return;

    setFetchError('');
    setIsLoading(true);

    fetch(`${BACKEND_URL}/healthRecords/${user.token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setHealthRecords(data.healthRecords ?? []);
        } else {
          setFetchError(data.error || "L'historique n'a pas pu être chargé");
        }
      })
      .catch(() => setFetchError('Impossible de contacter le serveur'))
      .finally(() => setIsLoading(false));
  }, [hasNss, user.token]);

  /* ============================== HANDLERS =============================== */

  const handleGoToProfile = () => {
    setShowNssModal(false);
    navigation.navigate('Profil');
  };

  /* ========================== DERIVED VALUES ============================ */
//showing the fake date if nss not available after hold press on the screen
  const records = hasNss ? healthRecords : FAKE_HEALTH_RECORDS;
  const groups = groupRecords(records);

  /* ================================= JSX ================================ */

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          >
            <FontAwesome5 name='chevron-left' size={18} color='#ffffff' />
          </TouchableOpacity>
      </View>

      <Text style={styles.title}>Historique de Santé :</Text>

      {fetchError ? <Text style={styles.errorText}>{fetchError}</Text> : null}

      {!hasNss && showDemo ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            Exemple de données. Renseignez votre numéro de sécurité sociale pour
            consulter votre historique réel.
          </Text>
          <View style={styles.demoBannerActions}>
            <TouchableOpacity onPress={handleGoToProfile} activeOpacity={0.8}>
              <Text style={styles.demoBannerLink}>Compléter mon profil</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDemo(false)} activeOpacity={0.8}>
              <Text style={styles.demoBannerLink}>Quitter la démo</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!hasNss && !showDemo ? (
        <Pressable style={styles.locked} onLongPress={() => setShowDemo(true)}>
          <FontAwesome5 name='lock' size={48} color='#8e8e8e' />
          <Text style={styles.lockedText}>
            Renseignez votre numéro de sécurité sociale pour consulter votre
            historique de santé.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Compléter mon profil</Text>
          </TouchableOpacity>
        </Pressable>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size='large' color='#1b1b1b' />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            Aucun acte médical enregistré pour le moment.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {groups.map((group, index) => (
            <View key={group.key} style={styles.group}>
              {group.year && groups[index - 1]?.year !== group.year ? (
                <Text style={styles.groupYear}>{group.year}</Text>
              ) : null}
              <Text style={styles.groupLabel}>{group.label}</Text>

              {group.records.map((record) => (
                <View key={record._id} style={styles.card}>
                  <Text style={styles.cardTitle}>{record.label}</Text>
                  {record.practitioner ? (
                    <Text style={styles.cardSubtitle}>
                      {record.practitioner.firstname} {record.practitioner.lastname}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={showNssModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowNssModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Numéro de sécurité sociale requis</Text>
            <Text style={styles.modalText}>
              Votre historique de santé est rattaché à votre numéro de sécurité
              sociale. Renseignez-le dans votre profil pour y accéder.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Compléter mon profil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowNssModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================================ STYLES =============================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
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
    paddingHorizontal: 20,
    marginTop: 16,
  },
  errorText: {
    color: '#d00000',
    fontSize: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  demoBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fdf3d7'
  },
  demoBannerText: {
    fontSize: 13,
    color: '#4a4a4a'
  },
  demoBannerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  demoBannerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1b1b1b'
  },
  scrollContent: {
    paddingBottom: 32
  },
  group: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  groupYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b'
  },
  groupLabel: {
    fontSize: 16,
    color: '#6b6b6b',
    marginBottom: 12
  },
  card: {
    borderWidth: 2,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    marginHorizontal: 8
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b'
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#1b1b1b'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#6b6b6b',
    textAlign: 'center'
  },
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20
  },
  lockedText: {
    fontSize: 16,
    color: '#4a4a4a',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 30
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 10
  },
  modalText: {
    fontSize: 15,
    color: '#4a4a4a',
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#1b1b1b',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    alignSelf: 'stretch'
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#4a4a4a'
  }
});
