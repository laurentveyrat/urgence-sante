export function validateNumeroSecu(value) {
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

export function validateEmail(value) {
  if (!value) return "L'email est requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "L'email n'est pas valide";
  }
  return "";
}

export function validatePassword(value) {
  if (!value) return "Le mot de passe est requis";
  if (value.length < 8) return "8 caractères minimum";
  if (!/[A-Z]/.test(value)) return "Au moins une majuscule";
  if (!/[a-z]/.test(value)) return "Au moins une minuscule";
  if (!/[^A-Za-z0-9]/.test(value)) return "Au moins un caractère spécial";
  return "";
}
