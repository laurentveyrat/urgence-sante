import { useEffect, useRef, useState } from 'react';
import { Keyboard, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSelector } from 'react-redux';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';


const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_ADRESS;
const POLL_INTERVAL = 10000;

export default function ResponderMapScreen({ navigation }) {
  /* ------------------------- Redux, state, refs ------------------------- */

  const user = useSelector((state) => state.user.value);
  const isFocused = useIsFocused();

  /* A secouriste sees the alerts, everyone else looks for a secouriste */
  const mode = user.isFirstResponder ? 'mission' : 'help';

  const [firstResponders, setFirstResponders] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedFirstResponder, setSelectedFirstResponder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [myResponder, setMyResponder] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);


  const mapRef = useRef(null);

  /* ================================ EFFECTS ============================== */

  useEffect(() => {
    if (mode !== 'help') return;

    fetch(`${BACKEND_URL}/firstResponders`)
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setFirstResponders(data.firstResponders ?? []);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [mode]);

  /* ------------------------ to locate currentPosition ----------------------- */

  useEffect(() => {

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        Location.watchPositionAsync({ distanceInterval: 10 },
          (location) => {
            setCurrentPosition(location.coords);

            if (!user.token) return;

            /*if I am first responder I need to send my location for other users */
            fetch(`${BACKEND_URL}/firstResponders/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: user.token,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }),
            }).catch((error) => console.error(error));
          });
      } else {
        console.warn('Location permission denied');
      }
    })().catch((error) => {
      console.error(error);
    });
  }, []);

  /* -------------- Address autocomplete suggestions while typing ------------- */

  useEffect(() => {
    if (search.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(search)}&limit=5`)
        .then((response) => response.json())
        .then((data) => {
          setSuggestions(data.features || []);
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---- My responder profile  ---- */

  useEffect(() => {
    if (!user.token) return;

    fetch(`${BACKEND_URL}/firstResponders/me/${user.token}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.result) return;

        setMyResponder(data.firstResponder);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [user.token]);



  /* --------- Pending alerts, polled while the mission mode is open --------- */

  useEffect(() => {
    if (mode !== 'mission' || !isFocused || !myResponder || !user.token) return;
    
    const fetchPendingAlerts = () => {
      fetch(`${BACKEND_URL}/alerts/pending/${user.token}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.result) {
            setPendingAlerts(data.alerts ?? []);
          }
        })
        .catch((error) => console.error(error));
    };

    fetchPendingAlerts();
    const interval = setInterval(fetchPendingAlerts, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [mode, isFocused, myResponder, user.token]);


  
  /* ============================== HANDLERS =============================== */

  /* -------------------- show firstResponder contact card -------------------- */

  const handlePress = (firstResponder) => {
    setSelectedFirstResponder(firstResponder);
    setModalVisible(true);
  };


  const handleClose = () => {
    setModalVisible(false);
    setSelectedFirstResponder(null);
  };


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
        } else {
          alert(data.error || "L'alerte n'a pas pu être envoyée. Appelez le 15 (SAMU).");
        }
      })
      .catch(() => {
        alert("L'alerte n'a pas pu être envoyée. Appelez le 15 (SAMU).");
      });
  };

  const handleAlert = () => {
    if (!user.token) return;
    createAlert();
  };

  /* ----------- to suggest addresses while typing in the search bar ---------- */

  const handleSelectSuggestion = (suggestion) => {
    const [longitude, latitude] = suggestion.geometry.coordinates;

    setSearch(suggestion.properties.label);
    setSuggestions([]);
    Keyboard.dismiss();

    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      1000
    );
  };

  /* -------- handler to locate current position just like google maps -------- */

  const handleLocate = () => {
    if (!currentPosition) return;

    mapRef.current?.animateToRegion(
      {
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  /* -------- handlers if I were first responder -------- */

  const handleToggleAvailability = async () => {
 //not finished
  };

  const handleAcceptAlert = (alertToAccept) => {
    fetch(`${BACKEND_URL}/alerts/${alertToAccept.id}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setActiveAlert(alertToAccept);
          setPendingAlerts((pendingAlert) => pendingAlert.filter((alert) => alert.id !== alertToAccept.id));
          //const isNotAccepted = (e) => e.id !== alertToAccept.id;
          //setPendingAlerts((prev) => prev.filter(isNotAccepted));
        } else {
          alert(data.error);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleCloseAlert = () => {
    if (!activeAlert) return;

    fetch(`${BACKEND_URL}/alerts/${activeAlert.id}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: user.token }),
    })
      .then((response) => response.json())
      .then(() => setActiveAlert(null))
      .catch((error) => {
        console.error(error);
      });
  };
// waiting for FindHospitalScreen to adapt the same code


  /* ========================== DERIVED VALUES ============================ */

  const markers = firstResponders.map((firstResponder) => {
    return <Marker
      key={firstResponder.id}
      coordinate={{ latitude: firstResponder.latitude, longitude: firstResponder.longitude }}
      title={firstResponder.name}
      onPress={() => handlePress(firstResponder)}
      />;
  });

  const alertMarkers = pendingAlerts.map((pendingAlert) => {
    return <Marker
      key={pendingAlert.id}
      coordinate={{ latitude: pendingAlert.latitude, longitude: pendingAlert.longitude }}
      title={pendingAlert.requesterName || 'Alerte'}
      pinColor="red"
      onPress={() => setSelectedAlert(pendingAlert)}
      />;
  });

  const heading = mode === 'mission'
    ? { title: 'Alertes', subtitle: 'À proximité :' }
    : { title: 'Trouver un Secouriste', subtitle: 'Proximité :' };

  /* ================================= JSX ================================ */

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <TouchableOpacity
              onPress={() => handleClose()}
              style={[styles.button, styles.buttonSecondary]}
              activeOpacity={0.8}
            >
              <Text style={[styles.textButton, styles.textButtonSecondary]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="chevron-left" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{heading.title}</Text>
      <Text style={styles.subtitle}>{heading.subtitle}</Text>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          mapType="standard"
          style={styles.map}
          showsUserLocation
          showsMyLocationButton
          onPress={() => Keyboard.dismiss()}
          onPanDrag={() => Keyboard.dismiss()}
          initialRegion={{
            latitude: 48.8869,
            longitude: 2.3021,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {mode === 'mission' ? alertMarkers : markers}
        </MapView>
        <TouchableOpacity
          style={[styles.locateButton, !currentPosition && styles.locateButtonDisabled]}
          onPress={handleLocate}
          disabled={!currentPosition}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="location-arrow" size={18} color="#1b1b1b" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une adresse"
              placeholderTextColor="#9b9b9b"
              value={search}
              onChangeText={setSearch}
            />
            <FontAwesome5 name="search" size={18} color="#1b1b1b" />
          </View>

          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.properties.id}
                  style={styles.suggestion}
                  onPress={() => handleSelectSuggestion(suggestion)}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="map-marker-alt" size={14} color="#1b1b1b" />
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {suggestion.properties.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
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
    paddingHorizontal: 20,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1b1b1b',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#1b1b1b',
  },
  suggestions: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#1b1b1b',
  },
  locateButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1,
  },
  locateButtonDisabled: {
    opacity: 0.5,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '78%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
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
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  certification: {
    fontSize: 14,
    color: '#6b6b6b',
    marginTop: 2,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#1b1b1b',
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1b1b1b',
  },
  textButton: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textButtonSecondary: {
    color: '#1b1b1b',
  },
});
