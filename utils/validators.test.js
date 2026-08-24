import {
  validateEmail,
  validatePassword,
  validateNumeroSecu,
} from "./validators";

describe("validateEmail", () => {
  it("retourne une erreur si l'email est vide", () => {
    expect(validateEmail("")).not.toBe("");
  });

  it("retourne une erreur si l'email est mal formé (sans @ ou .XXX)", () => {
    expect(validateEmail("pasunemail")).not.toBe("");
  });

  it("ne retourne pas d'erreur pour un email valide", () => {
    expect(validateEmail("test@example.com")).toBe("");
  });
});

describe("validatePassword", () => {
  it("retourne une erreur si le mot de passe est vide", () => {
    expect(validatePassword("")).not.toBe("");
  });

  it("retourne une erreur si le mot de passe contient moins de 8 caractères", () => {
    expect(validatePassword("t8GTh")).not.toBe("");
  });

  it("retourne une erreur si le mot de passe ne contient pas de majuscule", () => {
    expect(validatePassword("uhreg8668greg$")).not.toBe("");
  });

  it("retourne une erreur si le mot de passe ne contient pas de minuscule", () => {
    expect(validatePassword("GGHE78BDHHU879$")).not.toBe("");
  });

  it("retourne une erreur si le mot de passe ne contient pas de caractère spécial", () => {
    expect(validatePassword("ergOIIHIH889Hbdhdj")).not.toBe("");
  });

  it("ne retourne pas d'erreur pour un mot de passe valide", () => {
    expect(validatePassword("Abcdef1!")).toBe("");
  });
});

describe("validateNumeroSecu", () => {
  it("ne retourne pas d'erreur si la valeur est vide (champ optionnel)", () => {
    expect(validateNumeroSecu("")).toBe("");
  });

  it("retourne une erreur si le numéro ne contient pas exactement 13 chiffres", () => {
    expect(validateNumeroSecu("123")).not.toBe("");
  });

  it("retourne une erreur si le numéro fait 13 chiffres mais ne commence pas par 1 ou par 2", () => {
    expect(validateNumeroSecu("3850675123456")).not.toBe("");
  });

  it("retourne une erreur si le numéro fait 13 chiffres mais le mois n'est pas entre 01-12", () => {
    expect(validateNumeroSecu("1850013123456")).not.toBe("");
  });

  it("retourne une erreur si le numéro du département n'est pas valide", () => {
    expect(validateNumeroSecu("1850697123456")).not.toBe("");
  });

  it("ne retourne pas d'erreur si toutes les conditions sont réunies", () => {
    expect(validateNumeroSecu("1850675123456")).toBe("");
  });
});
