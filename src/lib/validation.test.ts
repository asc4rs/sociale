import { describe, it, expect } from "vitest";
import { pseudoValide, motDePasseValide, texteValide } from "./validation";

describe("pseudoValide", () => {
  it("accepte un pseudo correct", () => {
    expect(pseudoValide("jean_dupont")).toBe(true);
  });

  it("refuse les majuscules, espaces et accents", () => {
    expect(pseudoValide("Jean")).toBe(false);
    expect(pseudoValide("jean dupont")).toBe(false);
    expect(pseudoValide("élodie")).toBe(false);
  });

  it("refuse un pseudo trop court ou trop long", () => {
    expect(pseudoValide("ab")).toBe(false);
    expect(pseudoValide("a".repeat(21))).toBe(false);
  });
});

describe("motDePasseValide", () => {
  it("exige au moins 8 caractères", () => {
    expect(motDePasseValide("1234567")).toBe(false);
    expect(motDePasseValide("12345678")).toBe(true);
  });
});

describe("texteValide", () => {
  it("refuse un texte vide ou composé d'espaces", () => {
    expect(texteValide("   ", 280)).toBe(false);
  });

  it("respecte la limite de caractères", () => {
    expect(texteValide("a".repeat(280), 280)).toBe(true);
    expect(texteValide("a".repeat(281), 280)).toBe(false);
  });
});