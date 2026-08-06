import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import CreateAccountScreen from "./screens/CreateAccountScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import TrainingScreen from "./screens/TrainingScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EmergencyScreen from "./screens/EmergencyScreen";
import FindHospitalsScreen from "./screens/FindHospitalsScreen";
import ResponderMapScreen from "./screens/ResponderMapScreen";

import { Provider } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import user from "./reducers/user";

const reducers = combineReducers({ user });
const persistConfig = { key: "urgence-sante", storage: AsyncStorage };

const store = configureStore({
  reducer: persistReducer(persistConfig, reducers),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
const persistor = persistStore(store);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// -------------------------- TAB NAVIGATOR -------------------------

const TAB_ICONS = {
  Accueil: "home-outline",
  Formation: "map-outline",
  Historique: "document-text-outline",
  Profil: "person-outline",
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Formation" component={TrainingScreen} />
      <Tab.Screen name="Historique" component={HistoryScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// -------------------------- JSX -------------------------
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="CreateAccount"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen
              name="CreateAccount"
              component={CreateAccountScreen}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen
              name="FindHospitals"
              component={FindHospitalsScreen}
            />
            <Stack.Screen
              name="ResponderMapScreen"
              component={ResponderMapScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
