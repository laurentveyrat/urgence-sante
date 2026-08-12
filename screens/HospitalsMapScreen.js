import { useEffect, useRef, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

// -------------------------- VARIABLES / CONSTANTES / UTILITAIRES -------------------------
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_ADRESS;
const randomWaitMinutes = () => Math.floor(Math.random() * (120 - 15 + 1)) + 15;

const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };
const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 30; // vitesse moyenne estimée en ville

const toRad = (value) => (value * Math.PI) / 180;

const getDistanceKm = (from, to) => {
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

const getDurationMin = (distanceKm) =>
  Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);

const getWaitColor = (minutes) => {
  if (minutes < 35) return "#2e7d32"; // vert
  if (minutes <= 70) return "#e0862c"; // orange
  return "#c0392b"; // rouge
};

const formatWaitTime = (minutes) => {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${String(remainingMinutes).padStart(2, "0")} min`;
};

const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Clés déjà normalisées (minuscules, sans accents) pour matcher normalize(profile) / normalize(symptom)
const PROFILE_SPECIALTIES = {
  bebe: ["pediatrie"],
  enfant: ["pediatrie"],
  adulte: ["urgences generales"],
  "personne agee": ["urgences generales"],
  "mal. chronique": ["urgences generales", "hematologie"],
};

const SYMPTOM_SPECIALTIES = {
  toux: ["pediatrie", "urgences generales"],
  fievre: ["pediatrie", "urgences generales"],
  vertige: ["urgences generales"],
  nausees: ["gastro-enterologie"],
  diarrhee: ["gastro-enterologie"],
  "douleurs abdominales": ["gastro-enterologie"],
};

const getMatchScore = (hospitalSpecialties, relevantSpecialties) => {
  const normalizedSpecialties = hospitalSpecialties.map(normalize);
  let score = 0;

  relevantSpecialties.forEach((keyword) => {
    if (
      normalizedSpecialties.some((specialty) => specialty.includes(keyword))
    ) {
      score += 1;
    }
  });

  return score;
};

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

// -------------------------- COMPONENT -------------------------
export default function HospitalsMapScreen({ navigation, route }) {
  const { profile = "Bébé", symptoms = ["Toux", "Douleurs abdominales"] } =
    route.params ?? {};

  // -------------------------- STATES -------------------------
  const [hospitals, setHospitals] = useState([]);
  const [selectedId, setSelectedId] = useState(hospitals[0]?.id ?? null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: hospitals[0]?.latitude ?? 48.8566,
    longitude: hospitals[0]?.longitude ?? 2.3522,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [listLayoutHeight, setListLayoutHeight] = useState(0);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [listScrollY, setListScrollY] = useState(0);

  const relevantSpecialties = useMemo(() => {
    const fromProfile = PROFILE_SPECIALTIES[normalize(profile)] ?? [];
    const fromSymptoms = symptoms.flatMap(
      (symptom) => SYMPTOM_SPECIALTIES[normalize(symptom)] ?? [],
    );
    return new Set([...fromProfile, ...fromSymptoms]);
  }, [profile, symptoms]);

  const hospitalsWithDistance = useMemo(() => {
    const origin = currentPosition ?? PARIS_CENTER;

    return hospitals
      .map((hospital) => {
        const distanceKm = getDistanceKm(origin, hospital);
        const durationMin = getDurationMin(distanceKm);
        return {
          ...hospital,
          distanceKm,
          durationMin,
          totalMinutes: hospital.waitMinutes + durationMin,
          matchScore: getMatchScore(hospital.specialties, relevantSpecialties),
        };
      })
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.totalMinutes - b.totalMinutes;
      });
  }, [hospitals, currentPosition, relevantSpecialties]);

  // -------------------------- FUNCTIONS -------------------------
  const handleZoom = (factor) => {
    setRegion((prev) => {
      const nextRegion = {
        ...prev,
        latitudeDelta: prev.latitudeDelta * factor,
        longitudeDelta: prev.longitudeDelta * factor,
      };
      mapRef.current?.animateToRegion(nextRegion, 200);
      return nextRegion;
    });
  };

  // centers the map on the selected hospital
  const handleSelectHospital = (hospital) => {
    setSelectedId(hospital.id);
    const nextRegion = {
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 400);
  };

  // open Google Maps app
  const handleStartNavigation = () => {
    const hospital = hospitalsWithDistance.find((h) => h.id === selectedId);
    if (!hospital) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  /* ------------------------ fetch hospitals from backend ----------------------- */
  useEffect(() => {
    fetch(`${BACKEND_URL}/hospitals`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.result) return;

        const fetchedHospitals = data.hospitals.map((hospital) => ({
          ...hospital,
          waitMinutes: randomWaitMinutes(),
        }));

        setHospitals(fetchedHospitals);

        const first = fetchedHospitals[0];
        if (first) {
          setSelectedId(first.id);
          setRegion({
            latitude: first.latitude,
            longitude: first.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  /* ------------------------ to locate currentPosition ----------------------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        Location.watchPositionAsync({ distanceInterval: 10 }, (location) => {
          setCurrentPosition(location.coords);
        });
      } else {
        console.warn("Location permission denied");
      }
    })().catch((error) => {
      console.error(error);
    });
  }, []);

  /* ------------------------ search for the best route ----------------------- */
  useEffect(() => {
    if (!currentPosition || !selectedId) return;

    const hospital = hospitals.find((h) => h.id === selectedId);
    if (!hospital) return;

    const origin = `${currentPosition.latitude},${currentPosition.longitude}`;
    const destination = `${hospital.latitude},${hospital.longitude}`;
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
  }, [currentPosition, selectedId, hospitals]);

  // -------------------------- DERIVED VALUES -------------------------
  const canScrollList = listContentHeight > listLayoutHeight;
  const listThumbHeight = canScrollList
    ? Math.max((listLayoutHeight / listContentHeight) * listLayoutHeight, 30)
    : 0;
  const listScrollRange = listContentHeight - listLayoutHeight;
  const listThumbTravel = listLayoutHeight - listThumbHeight;
  const listThumbOffset =
    canScrollList && listScrollRange > 0
      ? Math.min(
          Math.max((listScrollY / listScrollRange) * listThumbTravel, 0),
          listThumbTravel,
        )
      : 0;

  // -------------------------- JSX -------------------------
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerTexts}>
          <Text style={styles.title}>{hospitals.length} hôpitaux trouvés</Text>
          <Text style={styles.subtitle}>
            Pour : {profile.toLowerCase()} ·{" "}
            {symptoms.join(" · ").toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation
          showsMyLocationButton={false}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {hospitals.map((hospital) => (
            <Marker
              key={hospital.id}
              coordinate={{
                latitude: hospital.latitude,
                longitude: hospital.longitude,
              }}
              title={hospital.name}
              pinColor={hospital.id === selectedId ? "#7A0C25" : "#000"}
              onPress={() => handleSelectHospital(hospital)}
            />
          ))}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#7A0C25"
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Boutons zoom */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom(0.5)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#000" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoom(2)}
            activeOpacity={0.8}
          >
            <Ionicons name="remove" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des hôpitaux */}
      <View style={styles.listPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onLayout={(event) =>
            setListLayoutHeight(event.nativeEvent.layout.height)
          }
          onContentSizeChange={(width, height) => setListContentHeight(height)}
          onScroll={(event) =>
            setListScrollY(event.nativeEvent.contentOffset.y)
          }
          scrollEventThrottle={16}
        >
          {hospitalsWithDistance.map((hospital) => {
            const isSelected = hospital.id === selectedId;

            return (
              <TouchableOpacity
                key={hospital.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelectHospital(hospital)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {hospital.name}
                  </Text>
                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.distanceBadge,
                        isSelected && styles.distanceBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.distanceBadgeText,
                          isSelected && styles.distanceBadgeTextSelected,
                        ]}
                      >
                        {hospital.distanceKm.toFixed(1)} km ·{" "}
                        {hospital.durationMin} min
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.cardSpecialties}>
                  {hospital.specialties.join(" · ")}
                </Text>

                <View style={styles.waitRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={getWaitColor(hospital.waitMinutes)}
                  />
                  <Text
                    style={[
                      styles.waitText,
                      { color: getWaitColor(hospital.waitMinutes) },
                    ]}
                  >
                    {formatWaitTime(hospital.waitMinutes)} d'attente
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {canScrollList && (
          <View style={styles.scrollTrack} pointerEvents="none">
            <View
              style={[
                styles.scrollThumb,
                { height: listThumbHeight, top: listThumbOffset },
              ]}
            />
          </View>
        )}
      </View>

      {/* Boutton "Lancer la navigation" */}
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={handleStartNavigation}
        activeOpacity={0.85}
      >
        <Text style={styles.navigateButtonText}>Lancer la navigation →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// -------------------------- STYLE -------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 13,
    color: "#8e8e8e",
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  zoomControls: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomDivider: {
    height: 1,
    backgroundColor: "#eee",
  },
  listPanel: {
    flex: 1,
    backgroundColor: "#fff",
    paddingLeft: 20,
    paddingTop: 16,
    position: "relative",
  },
  listContent: {
    paddingRight: 28,
    paddingBottom: 4,
  },
  scrollTrack: {
    position: "absolute",
    top: 16,
    right: 8,
    bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#eee",
  },
  scrollThumb: {
    position: "absolute",
    width: 4,
    borderRadius: 2,
    backgroundColor: "#b0b0b0",
  },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: "#7A0C25",
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
  },
  distanceBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  distanceBadgeSelected: {
    backgroundColor: "#7A0C25",
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  distanceBadgeTextSelected: {
    color: "#fff",
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7A0C25",
    alignItems: "center",
    justifyContent: "center",
  },
  cardSpecialties: {
    fontSize: 13,
    color: "#8e8e8e",
    marginTop: 6,
  },
  waitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  waitText: {
    fontSize: 13,
    fontWeight: "700",
  },
  navigateButton: {
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  navigateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
