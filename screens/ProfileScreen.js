import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateSocialSecurityNumber } from '../reducers/user';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_ADRESS;

// --------------------- VALIDATION ------------------
function validateNss(value) {
  if (!value) return ""; // optionnel

  const match = /^(\d)(\d{2})(\d{2})(\d{2})(\d{3})(\d{3})$/.exec(value);
  if (!match) {
    return "Le numéro de sécurité sociale doit contenir 13 chiffres";
  }
  const [, sexe, , mois, departement] = match;

  if (sexe !== "1" && sexe !== "2") {
    return "1er chiffre invalide : sexe attendu (1 homme, 2 femme)";
  }

  const moisNum = Number(mois);
  if (moisNum < 1 || moisNum > 12) {
    return "Chiffres 4-5 invalides : mois de naissance attendu (01-12)";
  }

  const departementNum = Number(departement);
  if (departementNum < 1 || (departementNum > 95 && departementNum !== 99)) {
    return "Chiffres 6-7 invalides : département de naissance attendu";
  }

  return "";
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

function toDisplayDate(value) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export default function ProfileScreen({ navigation }) {
  const user = useSelector((state) => state.user.value);
  const dispatch = useDispatch();

  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [nss, setNss] = useState('');


  const [birthdateError, setBirthdateError] = useState('');
  const [birthdateTouched, setBirthdateTouched] = useState(false);

  const [postalCodeError, setPostalCodeError] = useState('');
  const [postalCodeTouched, setPostalCodeTouched] = useState(false);

  const [nssError, setNssError] = useState('');
  const [nssTouched, setNssTouched] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isEditing, setIsEditing] = useState(true);

useEffect(() => {
  if (!user.token) return;

  fetch(`${BACKEND_URL}/users/profile/${user.token}`)
  .then((response) => response.json())
  .then((data) => {
    if (!data.result) return;

    const profile = data.profile;

    setFirstname(profile.firstname || '');
    setLastname(profile.lastname || '');
    setBirthdate(profile.birthdate ? toDisplayDate(profile.birthdate) : '');
    setStreet(profile.address?.street || '');
    setPostalCode(profile.address?.postalCode ? String(profile.address.postalCode) : '');
    setCity(profile.address?.city || '');
    setCountry(profile.address?.country || '');
    setNss(profile.socialSecurityNumber || '');
    setPhoto(profile.photo || null);
    setIsEditing(!profile.firstname)
  })
  .catch((error) => {
    console.log(error);
  });
}, [user.token]);



  const clearSaveMessages = () => {
    setSaveError('');
    setSaveSuccess(false);
  };

  const handleEdit = () => {
    clearSaveMessages();
    setIsEditing(true);
  };

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
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

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    setPhoto(uri);
    clearSaveMessages();

    if (!user.token) {
      setPhotoError('Connectez-vous pour enregistrer votre photo.');
      return;
    }

    const formData = new FormData();
    formData.append('photoFromFront', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
    formData.append('token', user.token);

    fetch(`${BACKEND_URL}/users/profile/upload`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setPhoto(data.url);
        } else {
          setPhotoError(data.error || "La photo n'a pas pu être enregistrée");
        }
      })
      .catch(() => {
        setPhotoError('Impossible de contacter le serveur');
      });
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

  const handleLogout = () => {
    dispatch(logout());
    navigation.getParent().reset({ routes: [{ name: "Login" }] });
// clear the profile after logout(another method)
    // setPhoto(null);
    // setPhotoError('');
    // setFirstname('');
    // setLastname('');
    // setBirthdate('');
    // setStreet('');
    // setPostalCode('');
    // setCity('');
    // setCountry('');
    // setNss('');
    // setBirthdateError('');
    // setBirthdateTouched(false);
    // setPostalCodeError('');
    // setPostalCodeTouched(false);
    // setNssError('');
    // setNssTouched(false);
    // setIsSaving(false);
    // setIsEditing(true);
    // clearSaveMessages();

    // navigation.navigate('Login');
    
  };


  const handleSave = () => {
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
    clearSaveMessages();

    if (!user.token) {
      setSaveError('Connectez-vous pour enregistrer votre profil.');
      return;
    }

    setIsSaving(true);

    // sending only filled-in fields
    const body = { token: user.token };
    if (firstname) body.firstname = firstname;
    if (lastname) body.lastname = lastname;
    if (birthdate) body.birthdate = toIsoDate(birthdate);
    if (nss) body.socialSecurityNumber = nss;

    //adress is sous-document in mongoDB
    const address = {};
    if (street) address.street = street;
    if (postalCode) address.postalCode = Number(postalCode);
    if (city) address.city = city;
    if (country) address.country = country;
    if (Object.keys(address).length > 0) body.address = address;

    fetch(`${BACKEND_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result) {
          setSaveSuccess(true);
          setIsEditing(false);
          dispatch(updateSocialSecurityNumber(nss));
        } else {
          setSaveError(data.error || "Le profil n'a pas pu être enregistré");
        }
      })
      .catch(() => {
        setSaveError('Impossible de contacter le serveur');
      })
      .finally(() => {
        setIsSaving(false);
      });
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

          {isEditing ? (
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
          ) : (
            <TouchableOpacity
            style={styles.saveButton}
            onPress={handleEdit}
            activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
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
  logoutButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
});
