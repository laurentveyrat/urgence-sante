import { StatusBar } from "expo-status-bar";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../reducers/user";

// --------------------- VALIDATION ------------------
function validateEmail(value) {
  if (!value) return "L'email est requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "L'email n'est pas valide";
  }
  return "";
}

function validatePassword(value) {
  if (!value) return "Le mot de passe est requis";
  return "";
}

// --------------------- STATES ------------------
export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------- HANDLERS ------------------
  const handleChangeEmail = (value) => {
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
  };

  const handleChangePassword = (value) => {
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  const handleSubmit = async () => {
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    const isValid = !newErrors.email && !newErrors.password;
    if (!isValid) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_ADRESS}/users/signin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();

      if (data.result) {
        dispatch(login({ email: data.email, token: data.token, socialSecurityNumber: data.socialSecurityNumber, isFirstResponder: data.isFirstResponder, }));
        navigation.navigate("MainTabs");
      } else {
        setSubmitError(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      setSubmitError("Impossible de contacter le serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------- JSX ------------------
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={handleChangeEmail}
        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {touched.email && errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={handleChangePassword}
        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
        secureTextEntry
      />
      {touched.password && errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Connexion..." : "SE CONNECTER"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
        <Text style={styles.link}>Pas encore de compte ? Créer un compte</Text>
      </TouchableOpacity>

      <Image source={require("../assets/urgence_sante.png")} style={styles.logo} />
      <Text style={styles.logoText}>{"Urgence\nSanté"}</Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: "contain",
    marginTop: 64,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 0,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 40,
    alignSelf: "flex-start",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "black",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    width: "100%",
    marginBottom: 8,
  },
  errorText: {
    color: "#d00000",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "black",
    borderRadius: 30,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 1,
  },
  link: {
    marginTop: 16,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
