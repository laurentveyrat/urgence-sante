import { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useSelector } from "react-redux";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_ADRESS;
const POLL_INTERVAL = 10000;

const decodePolyline = (encoded) => {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
};

export default function ResponderMapScreen({ navigation }) {
  /* ------------------------- Redux, state, refs ------------------------- */

  const user = useSelector((state) => state.user.value);
  const isFocused = useIsFocused();

  /* A secouriste sees the alerts, everyone else looks for a secouriste */
  const mode = user.isFirstResponder ? "mission" : "help";

  const [firstResponders, setFirstResponders] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedFirstResponder, setSelectedFirstResponder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertSentTo, setAlertSentTo] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [myResponder, setMyResponder] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const mapRef = useRef(null);

  /* ================================ EFFECTS ============================== */

  useEffect(() => {
    if (mode !== "help") return;

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

      if (status === "granted") {
        Location.watchPositionAsync({ distanceInterval: 10 }, (location) => {
          setCurrentPosition(location.coords);

          if (!user.token) return;

          /*if I am first responder I need to send my location for other users */
          fetch(`${BACKEND_URL}/firstResponders/location`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: user.token,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }),
          }).catch((error) => console.error(error));
        });
      } else {
        console.warn("Location permission denied");
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
      fetch(
        `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(search)}&limit=5`,
      )
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
    if (mode !== "mission" || !isFocused || !myResponder || !user.token) return;

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

  /* ------------- Trajet du secouriste vers l'alerte acceptée ------------- */

  useEffect(() => {
    if (!currentPosition || !activeAlert) {
      setRouteCoordinates([]);
      return;
    }

    const origin = `${currentPosition.latitude},${currentPosition.longitude}`;
    const destination = `${activeAlert.latitude},${activeAlert.longitude}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const points = data.routes?.[0]?.overview_polyline?.points;
        setRouteCoordinates(points ? decodePolyline(points) : []);
      })
      .catch((error) => {
        console.error(error);
        setRouteCoordinates([]);
      });
  }, [currentPosition, activeAlert]);

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: user.token,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        firstResponderId: selectedFirstResponder.id,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setAlertSentTo(selectedFirstResponder.id);
        } else {
          alert(
            data.error ||
              "L'alerte n'a pas pu être envoyée. Appelez le 15 (SAMU).",
          );
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
      1000,
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
      1000,
    );
  };

  /* -------- handlers if I were first responder -------- */

const handleToggleAvailability = () => {
  if (!user.token || !myResponder) return;

  const nextAvailability = !myResponder.isAvailable;

  fetch(`${BACKEND_URL}/firstResponders/availability`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: user.token, isAvailable: nextAvailability }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.result) {
        setMyResponder({ ...myResponder, isAvailable: nextAvailability });
      }
    })
    .catch((error) => console.error(error));
};


  const handleAcceptAlert = (alertToAccept) => {
    fetch(`${BACKEND_URL}/alerts/${alertToAccept.id}/accept`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user.token }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setActiveAlert(alertToAccept);
          setSelectedAlert(null);
          setPendingAlerts((pendingAlert) =>
            pendingAlert.filter((alert) => alert.id !== alertToAccept.id),
          );
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: user.token }),
    })
      .then((response) => response.json())
      .then(() => setActiveAlert(null))
      .catch((error) => {
        console.error(error);
      });
  };

  // open Google Maps app
  const handleStartNavigation = () => {
    if (!activeAlert) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeAlert.latitude},${activeAlert.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  /* ========================== DERIVED VALUES ============================ */

  const markers = firstResponders.map((firstResponder) => {
    return (
      <Marker
        key={firstResponder.id}
        coordinate={{
          latitude: firstResponder.latitude,
          longitude: firstResponder.longitude,
        }}
        title={firstResponder.name}
        pinColor={
          selectedFirstResponder?.id === firstResponder.id ? "#7A0C25" : "#000"
        }
        onPress={() => handlePress(firstResponder)}
      />
    );
  });

  const alertMarkers = pendingAlerts.map((pendingAlert) => {
    return (
      <Marker
        key={pendingAlert.id}
        coordinate={{
          latitude: pendingAlert.latitude,
          longitude: pendingAlert.longitude,
        }}
        title={pendingAlert.requesterName || "Alerte"}
        pinColor={selectedAlert?.id === pendingAlert.id ? "#7A0C25" : "#000"}
        onPress={() => setSelectedAlert(pendingAlert)}
      />
    );
  });

  const heading =
    mode === "mission"
      ? { title: "Alertes", subtitle: "À proximité :" }
      : { title: "Trouver un Secouriste", subtitle: "Proximité :" };

  /* ================================= JSX ================================ */

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Modal
        visible={selectedAlert !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedAlert && (
              <>
                <Text style={styles.name}>
                  {selectedAlert.requesterName || "Alerte"}
                </Text>
                {selectedAlert.requesterPhone && (
                  <Text style={styles.certification}>
                    {selectedAlert.requesterPhone}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => handleAcceptAlert(selectedAlert)}
                  style={styles.button}
                  activeOpacity={0.8}
                >
                  <Text style={styles.textButton}>Accepter l'alerte</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => setSelectedAlert(null)}
              style={[styles.button, styles.buttonSecondary]}
              activeOpacity={0.8}
            >
              <Text style={[styles.textButton, styles.textButtonSecondary]}>
                Refuser
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {selectedFirstResponder && (
              <>
                <View style={styles.avatarContainer}>
                  {selectedFirstResponder.photo ? (
                    <Image
                      source={{ uri: selectedFirstResponder.photo }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <FontAwesome5
                      name="user-circle"
                      size={120}
                      color="#1b1b1b"
                      solid
                    />
                  )}
                </View>
                <Text style={styles.name}>{selectedFirstResponder.name}</Text>
                <Text style={styles.certification}>
                  {selectedFirstResponder.certification}
                </Text>
                {selectedFirstResponder.phone ? (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${selectedFirstResponder.phone}`)
                    }
                    style={styles.button}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textButton}>
                      Appeler {selectedFirstResponder.phone}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
            {user.token && (
              <TouchableOpacity
                onPress={() => handleAlert()}
                style={[
                  styles.button,
                  (!currentPosition ||
                    alertSentTo === selectedFirstResponder?.id) &&
                    styles.buttonDisabled,
                ]}
                activeOpacity={0.8}
                disabled={
                  !currentPosition || alertSentTo === selectedFirstResponder?.id
                }
              >
                <Text style={styles.textButton}>
                  {alertSentTo === selectedFirstResponder?.id
                    ? "Alerte envoyée"
                    : "Envoyer une alerte"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleClose()}
              style={[styles.button, styles.buttonSecondary]}
              activeOpacity={0.8}
            >
              <Text style={[styles.textButton, styles.textButtonSecondary]}>
                Fermer
              </Text>
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

      {mode === "mission" && myResponder && (
        <View style={styles.availabilityRow}>
          <Text style={styles.availabilityLabel}>
            {myResponder.isAvailable ? "Disponible" : "Indisponible"}
          </Text>
          <Switch
            value={myResponder.isAvailable}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: "#9b9b9b", true: "#1b1b1b" }}
          />
        </View>
      )}

      {activeAlert && (
        <View style={styles.missionBanner}>
          <Text style={styles.missionText}>
            Mission en cours
            {activeAlert.requesterName ? ` — ${activeAlert.requesterName}` : ""}
          </Text>
          <View style={styles.missionButtons}>
            <TouchableOpacity
              onPress={handleStartNavigation}
              style={styles.missionButton}
              activeOpacity={0.8}
            >
              <Text style={styles.missionButtonText}>Y aller</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCloseAlert}
              style={[styles.missionButton, styles.missionButtonSecondary]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.missionButtonText,
                  styles.missionButtonTextSecondary,
                ]}
              >
                Terminer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
          {mode === "mission" ? alertMarkers : markers}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#7A0C25"
              strokeWidth={4}
            />
          )}
        </MapView>
        <TouchableOpacity
          style={[
            styles.locateButton,
            !currentPosition && styles.locateButtonDisabled,
          ]}
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
                  <FontAwesome5
                    name="map-marker-alt"
                    size={14}
                    color="#1b1b1b"
                  />
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
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1b1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1b1b1b",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1b1b1b",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  availabilityLabel: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1b1b1b",
  },
  missionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1b1b1b",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
  },
  missionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#ffffff",
  },
  missionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  missionButton: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  missionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1b1b1b",
  },
  missionButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  missionButtonTextSecondary: {
    color: "#ffffff",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#1b1b1b",
  },
  suggestions: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: "#1b1b1b",
  },
  locateButton: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "78%",
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b1b1b",
  },
  certification: {
    fontSize: 14,
    color: "#6b6b6b",
    marginTop: 2,
  },
  button: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: "#1b1b1b",
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1b1b1b",
  },
  textButton: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  textButtonSecondary: {
    color: "#1b1b1b",
  },
});
