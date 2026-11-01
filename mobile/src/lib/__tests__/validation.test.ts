import { isValidEmail, validateLogin, validateRegister, type RegisterFields } from "../validation";

const validRegister: RegisterFields = {
  pseudo: "Elodie",
  email: "elodie@example.com",
  password: "motdepasse",
  city: "Perpignan",
  territoryCode: "66",
  termsAccepted: true,
};

describe("isValidEmail", () => {
  it.each(["a@b.fr", "  prenom.nom@domaine.com  "])("accepte %p", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "sans-arobase", "a@b", "a b@c.fr"])("refuse %p", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("validateLogin", () => {
  it("exige email et mot de passe", () => {
    expect(validateLogin("", "x")).toMatch(/email et ton mot de passe/);
    expect(validateLogin("a@b.fr", "")).toMatch(/email et ton mot de passe/);
  });

  it("refuse un email mal formé", () => {
    expect(validateLogin("pas-un-email", "secret")).toMatch(/email valide/);
  });

  it("accepte des identifiants bien formés", () => {
    expect(validateLogin("a@b.fr", "secret")).toBeNull();
  });
});

describe("validateRegister", () => {
  it("accepte un formulaire complet", () => {
    expect(validateRegister(validRegister)).toBeNull();
  });

  it("accepte une ville vide (facultative)", () => {
    expect(validateRegister({ ...validRegister, city: "  " })).toBeNull();
  });

  it("exige un pseudo non vide", () => {
    expect(validateRegister({ ...validRegister, pseudo: "   " })).toMatch(/pseudo/);
  });

  it("applique la longueur minimale du mot de passe du backend (8)", () => {
    expect(validateRegister({ ...validRegister, password: "1234567" })).toMatch(/au moins 8/);
    expect(validateRegister({ ...validRegister, password: "12345678" })).toBeNull();
  });

  it("refuse un mot de passe de plus de 128 caractères", () => {
    expect(validateRegister({ ...validRegister, password: "a".repeat(129) })).toMatch(/128/);
  });

  it("exige un territoire", () => {
    expect(validateRegister({ ...validRegister, territoryCode: "" })).toMatch(/territoire/);
  });

  it("exige l'acceptation des conditions", () => {
    expect(validateRegister({ ...validRegister, termsAccepted: false })).toMatch(/accepter/);
  });
});
