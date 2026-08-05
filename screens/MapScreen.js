import { useEffect, useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const BACKEND_URL = 'http://192.168.1.73:3000';


const FIRST_RESPONDERS = [
  { id: 'mock-1', name: 'Marie D.', certification: 'PSE2', phone: '0639980112', latitude: 48.8869, longitude: 2.3021 },
  { id: 'mock-2', name: 'Karim B.', certification: 'PSE1', phone: '0639980237', latitude: 48.8842, longitude: 2.2986 },
  { id: 'mock-3', name: 'Sophie N.', certification: 'PSE2', phone: '0639980345', latitude: 48.8901, longitude: 2.3105 },
];

export default function MapScreen({ navigation }) {
  const user = useSelector((state) => state.user.value);
  const [firstResponders, setFirstResponders] = useState(FIRST_RESPONDERS);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedFirstResponder, setSelectedFirstResponder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertSent, setAlertSent] = useState(false);


// First responders: isResponder + isAvailable are filtered BACKEND-SIDE

  useEffect(() => {
    fetch(`${BACKEND_URL}/firstResponders`)
    .then((response) => response.json())
    .then((data) => {
      if (data.result && data.firstResponders.length > 0) {
        setFirstResponders(data.firstResponders);
      }
    })
    .catch((error) => {
      console.error(error);
    })
  }, []);


  const handlePress = (firstResponder) => {
    setSelectedFirstResponder(firstResponder);
    setModalVisible(true);
  };


  const handleClose = () => {
    setModalVisible(false);
    setSelectedFirstResponder(null);
  };

  // Logged in -> alert sent to the backend.
  // Not logged in -> no alert: the visitor calls from the contact card.

  const handleAlert = () => {
    if (!user.token) return;
    createAlert();
  };
  
  

  useEffect(() => {
   (async () => {
     const { status } = await Location.requestForegroundPermissionsAsync();
  
     if (status === 'granted') {
       Location.watchPositionAsync({ distanceInterval: 10 },
         (location) => {
           setCurrentPosition(location.coords);
         });
     } else {
        console.warn('Location permission denied');
     }
   })().catch((error) => {
     console.error(error);
   });
  }, []);

  const createAlert = () => {
    if (!currentPosition) return;

    fetch(`${BACKEND_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: user.token,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setAlertSent(true);
        }
      })
      .catch(() => {
        alert("L'alerte n'a pas pu être envoyée. Appelez le 15 (SAMU).");
      });
  };

  const markers = firstResponders.map((firstResponder) => {
    return <Marker
      key={firstResponder.id}
      coordinate={{ latitude: firstResponder.latitude, longitude: firstResponder.longitude }}
      title={firstResponder.name}
      onPress={() => handlePress(firstResponder)}
      />;
  });

  return (
    <View style={styles.container}>
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedFirstResponder && (
              <>
              <Text style={styles.name}>{selectedFirstResponder.name}</Text>
              <Text style={styles.certification}>{selectedFirstResponder.certification}</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${selectedFirstResponder.phone}`)}
                style={styles.button}
                activeOpacity={0.8}
                >
                  <Text style={styles.textButton}>Appeler {selectedFirstResponder.phone}</Text>
              </TouchableOpacity>
              </>
            )}
            {user.token && (
              <TouchableOpacity
                onPress={() => handleAlert()}
                style={[styles.button, (!currentPosition || alertSent) && styles.buttonDisabled]}
                activeOpacity={0.8}
                disabled={!currentPosition || alertSent}
              >
                <Text style={styles.textButton}>{alertSent ? 'Alerte envoyée' : 'Envoyer une alerte'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleClose()} style={styles.button} activeOpacity={0.8}>
              <Text style={styles.textButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MapView
        mapType="hybrid"
        style={styles.map}
        initialRegion={{
          latitude: 48.8869,
          longitude: 2.3021,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {currentPosition && <Marker coordinate={currentPosition} title="My position" pinColor="#fecb2d" />}
        {markers}
      </MapView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  certification: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  button: {
    width: 150,
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 8,
    backgroundColor: '#ec6e5b',
    borderRadius: 10,
  },
  textButton: {
    color: '#ffffff',
    height: 24,
    fontWeight: '600',
    fontSize: 15,
  },
});

