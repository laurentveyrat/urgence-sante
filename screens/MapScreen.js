import { useEffect, useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const BACKEND_URL = 'http://192.168.1.73:3000';


const FIRST_RESPONDERS = [
  { id: 'mock-1', name: 'Marie D.', certification: 'PSE2', phone: '0639980112', latitude: 48.8869, longitude: 2.3021 },
  { id: 'mock-2', name: 'Karim B.', certification: 'PSE1', phone: '0639980237', latitude: 48.8842, longitude: 2.2986 },
  { id: 'mock-3', name: 'Sophie N.', certification: 'PSE2', phone: '0639980345', latitude: 48.8901, longitude: 2.3105 },
];

export default function MapScreen({ navigation }) {
  const [firstResponders, setFirstResponders] = useState(FIRST_RESPONDERS);
  const [currentPosition, setCurrentPosition] = useState(null);




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
 
  const handlePress = (firstResponder) => {
    setSelectedFirstResponder(firstResponder);
    setModalVisible(true);
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
  text: {
    fontSize: 24,
  },
});
