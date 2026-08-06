import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";

// --------------------- VALIDATION ------------------
function validateNumeroSecu(value) {
  if (!value) return ""; // optionnel
  if (!/^\d{13}$/.test(value)) {
    return "Le numéro de sécurité sociale doit contenir 13 chiffres";
  }
  return "";
}

function validateEmail(value) {
  if (!value) return "L'email est requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "L'email n'est pas valide";
  }
  return "";
}

function validatePassword(value) {
  if (!value) return "Le mot de passe est requis";
  if (value.length < 8) return "8 caractères minimum";
  if (!/[A-Z]/.test(value)) return "Au moins une majuscule";
  if (!/[a-z]/.test(value)) return "Au moins une minuscule";
  if (!/[^A-Za-z0-9]/.test(value)) return "Au moins un caractère spécial";
  return "";
}

export default function CreateAccountScreen({ navigation }) {
  // --------------------- STATES ------------------
  const [numeroSecu, setNumeroSecu] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    numeroSecu: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    numeroSecu: false,
    email: false,
    password: false,
  });

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------- HANDLERS ------------------
  const handleChangeNumeroSecu = (value) => {
    setNumeroSecu(value);
    setErrors((prev) => ({ ...prev, numeroSecu: validateNumeroSecu(value) }));
  };

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
      numeroSecu: validateNumeroSecu(numeroSecu),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(newErrors);
    setTouched({ numeroSecu: true, email: true, password: true });

    const isValid =
      !newErrors.numeroSecu && !newErrors.email && !newErrors.password;
    if (!isValid) return;

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.BACKEND_ADRESS}/users/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            socialSecurityNumber: numeroSecu || undefined,
          }),
        },
      );
      const data = await response.json();

      if (data.result) {
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
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput
        style={styles.input}
        placeholder="N° Sécurité Sociale"
        value={numeroSecu}
        onChangeText={handleChangeNumeroSecu}
        onBlur={() => setTouched((prev) => ({ ...prev, numeroSecu: true }))}
        keyboardType="numeric"
        maxLength={13}
      />
      {touched.numeroSecu && errors.numeroSecu ? (
        <Text style={styles.errorText}>{errors.numeroSecu}</Text>
      ) : null}

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
          {isSubmitting ? "Création..." : "VALIDER"}
        </Text>
      </TouchableOpacity>
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
});
