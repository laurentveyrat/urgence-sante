import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://192.168.100.130:3000';

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

//sorting the dates --> decending from most recent
function groupRecords(records) {
  const sorted = [...records].sort((a, b) => new Date(b.occurredAt)- new Date(a.occurredAt));
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

  const [healthRecords, setHealthRecords] = useState(FAKE_HEALTH_RECORDS);
  const [fetchError, setFetchError] = useState('');
  const [showNssModal, setShowNssModal] = useState(false);

  /* ================================ EFFECTS ============================== */

  /* -- isFocused: render different content based on the current focus
        (no NSS on file) --> the modal opens(true);
        hasNSS is true --> the modal stays closed
        https://reactnavigation.org/docs/use-is-focused/
                                                         ---------------------------------------- */


  useEffect(() => {
    if (isFocused) setShowNssModal(!hasNss);
  }, [isFocused, hasNss]);


  useEffect(() => {
    if (!hasNss || !user.token) return;

    setFetchError('');

    fetch(`${BACKEND_URL}/healthRecords/${user.token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.result && data.healthRecords?.length > 0) {
          setHealthRecords(data.healthRecords);
        } else if (!data.result) {
          setFetchError(data.error || "L'historique n'a pas pu être chargé");
        }
      })
      .catch(() => setFetchError('Impossible de contacter le serveur'));
  }, [hasNss, user.token]);

  /* ========================== DERIVED VALUES ============================ */

  const groups = groupRecords(healthRecords);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {groups.map((group, index) => (
          <View key={group.key} style={styles.group}>
            {/* l'année ne se répète que lorsqu'elle change */}
            {groups[index - 1]?.year !== group.year ? (
              <Text style={styles.groupYear}>{group.year}</Text>
            ) : null}
            <Text style={styles.groupLabel}>{group.label}</Text>

            {group.records.map((record) => (
              <View key={record._id} style={styles.card}>
                <Text style={styles.cardTitle}>{record.label}</Text>
                {record.practitionerName ? (
                  <Text style={styles.cardSubtitle}>{record.practitionerName}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
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
  }
});
