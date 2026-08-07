import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';

const BACKEND_URL = 'http://192.168.100.130:3000';

// --------------------- VALIDATION ------------------
function validateNss(value) {
  if (!value) return ''; // optionnel
  if (!/^\d{13}$/.test(value)) {
    return 'Le numéro de sécurité sociale doit contenir 13 chiffres';
  }
  return '';
}

function validateBirthdate(value) {
  if (!value) return ''; // optionnel
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return 'Format attendu : JJ/MM/AAAA';
  }

  // Le format seul laisse passer 32/13/2020 : on vérifie que la date existe.
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getDate() !== day ||
    date.getMonth() !== month - 1 ||
    date.getFullYear() !== year
  ) {
    return "Cette date n'existe pas";
  }

  return '';
}

function validatePostalCode(value) {
  if (!value) return ''; // optionnel
  if (!/^\d{5}$/.test(value)) {
    return 'Le code postal doit contenir 5 chiffres';
  }
  return '';
}

function toIsoDate(value) {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

export default function ProfileScreen({ navigation }) {
  const user = useSelector((state) => state.user.value);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCodeError, setPostalCodeError] = useState('');
  const [postalCodeTouched, setPostalCodeTouched] = useState(false);
  const [nss, setNss] = useState('');
  const [nssError, setNssError] = useState('');
  const [nssTouched, setNssTouched] = useState(false);
  const [birthdateError, setBirthdateError] = useState('');
  const [birthdateTouched, setBirthdateTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);


  const clearSaveMessages = () => {
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      // Sans message, l'utilisateur appuie et il ne se passe rien.
      setPhotoError('Accès aux photos refusé. Autorisez-le dans les réglages.');
      return;
    }
    setPhotoError('');

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      clearSaveMessages();
    }
  };

  const handleChangeNss = (value) => {
    setNss(value);
    setNssError(validateNss(value));
    clearSaveMessages();
  };

  const handleChangeBirthdate = (value) => {
    setBirthdate(value);
    setBirthdateError(validateBirthdate(value));
    clearSaveMessages();
  };

  const handleChangePostalCode = (value) => {
    setPostalCode(value);
    setPostalCodeError(validatePostalCode(value));
    clearSaveMessages();
  };

  const handleSave = async () => {
    const nssErrorOnSave = validateNss(nss);
    const birthdateErrorOnSave = validateBirthdate(birthdate);
    const postalCodeErrorOnSave = validatePostalCode(postalCode);
    setNssError(nssErrorOnSave);
    setBirthdateError(birthdateErrorOnSave);
    setPostalCodeError(postalCodeErrorOnSave);
    setNssTouched(true);
    setBirthdateTouched(true);
    setPostalCodeTouched(true);
    if (nssErrorOnSave || birthdateErrorOnSave || postalCodeErrorOnSave) return;

    // Avant tout nouveau message : sinon un ancien "Profil enregistré" reste
    // affiché à côté de l'erreur ci-dessous.
    clearSaveMessages();

    if (!user.token) {
      setSaveError('Connectez-vous pour enregistrer votre profil.');
      return;
    }

    setIsSaving(true);

    // On n'envoie que les champs remplis : un champ laissé vide ne doit pas
    // écraser la valeur déjà enregistrée côté backend.
    const body = { token: user.token };
    if (firstname) body.firstname = firstname;
    if (lastname) body.lastname = lastname;
    if (birthdate) body.birthdate = toIsoDate(birthdate);
    if (nss) body.socialSecurityNumber = nss;

    // L'adresse est un sous-document côté backend, pas une chaîne de caractères.
    // Mongo remplace l'objet entier : les champs qu'on n'envoie pas sont perdus,
    // d'où les 4 inputs affichés ensemble plutôt qu'un champ libre.
    const address = {};
    if (street) address.street = street;
    if (postalCode) address.postalCode = Number(postalCode);
    if (city) address.city = city;
    if (country) address.country = country;
    if (Object.keys(address).length > 0) body.address = address;

    try {
      const response = await fetch(`${BACKEND_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (data.result) {
        setSaveSuccess(true);
      } else {
        setSaveError(data.error || "Le profil n'a pas pu être enregistré");
      }
    } catch (err) {
      setSaveError('Impossible de contacter le serveur');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {navigation.canGoBack() && (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="chevron-left" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAddPhoto}
            activeOpacity={0.8}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <FontAwesome5 name="user-circle" size={160} color="#1b1b1b" solid />
            )}
            <Text style={styles.avatarHint}>Appuyer pour changer la photo</Text>
          </TouchableOpacity>
          {photoError ? (
            <Text style={styles.photoErrorText}>{photoError}</Text>
          ) : null}

          <View style={[styles.row, styles.nameRow]}>
            <View style={styles.field}>
              <Text style={styles.label}>Prénom :</Text>
              <TextInput
                style={styles.input}
                value={firstname}
                onChangeText={(value) => {
                  setFirstname(value);
                  clearSaveMessages();
                }}
                placeholder='For'
                autoCapitalize='words'
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Nom :</Text>
              <TextInput
                style={styles.input}
                value={lastname}
                onChangeText={(value) => {
                  setLastname(value);
                  clearSaveMessages();
                }}
                placeholder='Sure'
                autoCapitalize='words'
              />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date de Naissance :</Text>
            <TextInput
              style={styles.input}
              value={birthdate}
              onChangeText={handleChangeBirthdate}
              onBlur={() => setBirthdateTouched(true)}
              placeholder='20/01/2026'
              keyboardType='numbers-and-punctuation'
              maxLength={10}
            />
            {birthdateTouched && birthdateError ? (
              <Text style={styles.errorText}>{birthdateError}</Text>
            ) : null}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresse :</Text>
            <TextInput
              style={styles.input}
              value={street}
              onChangeText={(value) => {
                setStreet(value);
                clearSaveMessages();
              }}
              placeholder='12 rue de la Paix'
              autoCapitalize='words'
            />
            <View style={styles.addressRow}>
              <View style={styles.postalCodeField}>
                <Text style={styles.subLabel}>Code postal :</Text>
                <TextInput
                  style={styles.input}
                  value={postalCode}
                  onChangeText={handleChangePostalCode}
                  onBlur={() => setPostalCodeTouched(true)}
                  placeholder='75002'
                  keyboardType='numeric'
                  maxLength={5}
                  autoCorrect={false}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.subLabel}>Ville :</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={(value) => {
                    setCity(value);
                    clearSaveMessages();
                  }}
                  placeholder='Paris'
                  autoCapitalize='words'
                />
              </View>
            </View>
            {postalCodeTouched && postalCodeError ? (
              <Text style={styles.errorText}>{postalCodeError}</Text>
            ) : null}
            <Text style={styles.subLabel}>Pays :</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={(value) => {
                setCountry(value);
                clearSaveMessages();
              }}
              placeholder='France'
              autoCapitalize='words'
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>N° Sécurité Sociale :</Text>
            <TextInput
              style={styles.input}
              value={nss}
              onChangeText={handleChangeNss}
              onBlur={() => setNssTouched(true)}
              placeholder='1851275116001'
              keyboardType='numeric'
              maxLength={13}
              autoCorrect={false}
            />
            {nssTouched && nssError ? (
              <Text style={styles.errorText}>{nssError}</Text>
            ) : null}
          </View>
          {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}
          {saveSuccess ? <Text style={styles.successText}>Profil enregistré</Text> : null}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex: {
    flex: 1,
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
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarHint: {
    fontSize: 15,
    color: '#4a4a4a',
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 6,
  },
  input: {
    fontSize: 17,
    color: '#1b1b1b',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginTop: 12,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  postalCodeField: {
    width: 110,
  },
  errorText: {
    color: '#d00000',
    fontSize: 12,
    marginTop: 6,
  },
  saveErrorText: {
    color: '#d00000',
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  photoErrorText: {
    color: '#d00000',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  successText: {
    color: '#1b7f3b',
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    backgroundColor: '#1b1b1b',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
